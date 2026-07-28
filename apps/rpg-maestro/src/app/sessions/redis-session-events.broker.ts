import { Logger } from '@nestjs/common';
import ms from 'ms';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { createRedisConnection, RedisConnection } from '../infrastructure/redis/redis-connection';
import { SessionEventsBroker, SessionEventsListener } from './session-events.broker';

/**
 * One channel for every session. Track changes happen a few times per session per hour, so splitting
 * them per session would buy nothing but a subscribe/unsubscribe dance on every stream open and close.
 * Instances filter by session id on receipt.
 */
export const SESSION_EVENTS_CHANNEL = 'rpg-maestro:session-playing-tracks';

/** How long before a failed subscribe is attempted again. */
export const SUBSCRIBE_RETRY_INTERVAL_MS = ms('5s');

/**
 * Redis pub/sub fanout, so a Maestro's track change reaches listeners connected to any instance.
 *
 * Losing it degrades rather than breaks: clients keep a slow poll running as a safety net, so a
 * dropped event costs latency, not correctness. That is why nothing here throws at the caller — a
 * failed publish is logged and the write it belongs to still stands.
 */
export class RedisSessionEventsBroker implements SessionEventsBroker {
  readonly name = 'redis';
  private readonly logger = new Logger(RedisSessionEventsBroker.name);
  private readonly publisher: RedisConnection;
  private readonly subscriber: RedisConnection;
  private listener: SessionEventsListener | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private closed = false;

  constructor(url: string) {
    this.publisher = createRedisConnection(url, 'session-events-publisher');
    // Subscribing puts a connection in a mode where it cannot run normal commands, hence the second one.
    this.subscriber = createRedisConnection(url, 'session-events-subscriber');
  }

  async publish(session: SessionPlayingTracks): Promise<void> {
    try {
      if (!this.publisher.isReady) {
        await this.publisher.connect();
      }
      await this.publisher.publish(SESSION_EVENTS_CHANNEL, JSON.stringify(session));
    } catch (error) {
      this.logger.warn(
        `could not publish the change of session "${session.sessionId}", listeners will pick it up on their next poll`,
        error
      );
    }
  }

  async subscribe(listener: SessionEventsListener): Promise<void> {
    this.listener = listener;
    await this.connectSubscriber();
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.listener = null;
    await Promise.all([
      this.publisher.isOpen ? this.publisher.close() : Promise.resolve(),
      this.subscriber.isOpen ? this.subscriber.close() : Promise.resolve(),
    ]);
  }

  /**
   * node-redis re-subscribes on its own once a connection it had established drops, so retrying is
   * only about the first connection: a Redis that is down at boot must not stop the app from serving
   * music, nor leave it permanently deaf once Redis is back.
   */
  private async connectSubscriber(): Promise<void> {
    if (this.closed) {
      return;
    }
    try {
      await this.subscriber.connect();
      await this.subscriber.subscribe(SESSION_EVENTS_CHANNEL, (message) => this.onMessage(message));
      this.logger.log(`subscribed to "${SESSION_EVENTS_CHANNEL}", session changes fan out across instances`);
    } catch (error) {
      this.logger.warn(
        `could not subscribe to "${SESSION_EVENTS_CHANNEL}", retrying in ${SUBSCRIBE_RETRY_INTERVAL_MS}ms — ` +
          `until then, listeners on this instance rely on their fallback poll`,
        error
      );
      this.retryTimer = setTimeout(() => {
        this.connectSubscriber().catch((retryError) => this.logger.warn('subscribe retry threw', retryError));
      }, SUBSCRIBE_RETRY_INTERVAL_MS);
      this.retryTimer.unref();
    }
  }

  private onMessage(message: string): void {
    try {
      // Plain data, not a PlayingTrack instance: nothing on the server side calls its methods, and it
      // is serialized again on its way out to the client.
      this.listener?.(JSON.parse(message) as SessionPlayingTracks);
    } catch (error) {
      this.logger.warn(`dropping an unparseable session event: ${message}`, error);
    }
  }
}

import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import ms from 'ms';
import { SessionID } from '@rpg-maestro/rpg-maestro-api-contract';
import { createRedisConnection, RedisConnection } from '../infrastructure/redis/redis-connection';
import { SessionListenersPresence } from './session-listeners-presence';
import { SessionStreamsRegistry } from './session-streams.registry';

/** One key per instance, holding that instance's `{sessionId: count}` map as JSON. */
export const LISTENERS_PRESENCE_KEY_PREFIX = 'rpg-maestro:listeners:';

/**
 * How long an instance's report stays credible without a refresh. An instance that dies without
 * cleaning up stops counting after this long — the price is that its last listeners linger in the
 * total for up to this long, which for an admin dashboard beats counting ghosts forever.
 */
export const LISTENERS_PRESENCE_TTL_S = 30;

/** Refreshes the TTL while nothing changes. Must fit at least twice into the TTL, or a single missed beat expires the key. */
export const LISTENERS_PRESENCE_HEARTBEAT_INTERVAL_MS = ms('10s');

/**
 * Cluster-wide listener presence over Redis.
 *
 * Every instance owns exactly one key and only ever writes its own local counts into it — written
 * through on every stream open/close and refreshed on a heartbeat. Reading is summing all instances'
 * keys. No shared counter is ever incremented, so a crashed instance cannot leak counts: its key
 * simply expires.
 *
 * Losing Redis degrades rather than breaks, like the events broker: writes are logged and dropped
 * (the next heartbeat retries), and reads fall back to this instance's own counts.
 */
export class RedisSessionListenersPresence implements SessionListenersPresence {
  readonly name = 'redis';
  private readonly logger = new Logger(RedisSessionListenersPresence.name);
  private readonly client: RedisConnection;
  private readonly ownKey: string;
  private readonly heartbeat: NodeJS.Timeout;
  private connecting: Promise<unknown> | null = null;

  constructor(
    url: string,
    private readonly registry: SessionStreamsRegistry,
    instanceId: string = randomUUID(),
    client?: RedisConnection
  ) {
    this.client = client ?? createRedisConnection(url, 'listeners-presence');
    this.ownKey = LISTENERS_PRESENCE_KEY_PREFIX + instanceId;
    this.registry.onChange(() => {
      this.reportOwnCounts().catch((error) => this.logger.warn('reporting a stream change threw', error));
    });
    this.heartbeat = setInterval(() => {
      this.reportOwnCounts().catch((error) => this.logger.warn('presence heartbeat threw', error));
    }, LISTENERS_PRESENCE_HEARTBEAT_INTERVAL_MS);
    this.heartbeat.unref();
  }

  async countsBySession(): Promise<Record<SessionID, number>> {
    try {
      await this.connectIfNeeded();
      const totals: Record<SessionID, number> = {};
      for await (const keys of this.client.scanIterator({ MATCH: `${LISTENERS_PRESENCE_KEY_PREFIX}*`, COUNT: 100 })) {
        for (const key of keys) {
          // node-redis reply typings degrade to `string | {}` here; both are strings on this client
          const keyName = String(key);
          const report = await this.client.get(keyName);
          if (report) {
            this.addCounts(totals, keyName, String(report));
          }
        }
      }
      return totals;
    } catch (error) {
      this.logger.warn('could not read listener presence from redis, reporting this instance own counts only', error);
      return this.registry.countsBySession();
    }
  }

  /** Called by Nest on shutdown (lifecycle hooks run on factory-provided instances too). */
  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async close(): Promise<void> {
    clearInterval(this.heartbeat);
    try {
      // Best effort: lets this instance's listeners drop from the total now instead of at TTL expiry.
      if (this.client.isReady) {
        await this.client.del(this.ownKey);
      }
    } catch (error) {
      this.logger.warn('could not remove own presence key on shutdown, it will expire on its own', error);
    }
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  private async reportOwnCounts(): Promise<void> {
    try {
      await this.connectIfNeeded();
      const counts = this.registry.countsBySession();
      if (Object.keys(counts).length === 0) {
        // An empty report and no report read the same, and a missing key is one less to scan.
        await this.client.del(this.ownKey);
      } else {
        await this.client.set(this.ownKey, JSON.stringify(counts), {
          expiration: { type: 'EX', value: LISTENERS_PRESENCE_TTL_S },
        });
      }
    } catch (error) {
      this.logger.warn('could not report listener counts, the next heartbeat or stream change retries', error);
    }
  }

  /**
   * Memoizes the in-flight connect: a stream change and a heartbeat can race here, and node-redis
   * throws "Socket already opened" on the second concurrent connect() of the same client.
   */
  private async connectIfNeeded(): Promise<void> {
    if (this.client.isReady) {
      return;
    }
    if (!this.connecting) {
      this.connecting = this.client.connect().finally(() => {
        this.connecting = null;
      });
    }
    await this.connecting;
  }

  private addCounts(totals: Record<SessionID, number>, key: string, report: string): void {
    try {
      for (const [sessionId, count] of Object.entries(JSON.parse(report) as Record<SessionID, number>)) {
        totals[sessionId] = (totals[sessionId] ?? 0) + count;
      }
    } catch (error) {
      this.logger.warn(`dropping an unparseable presence report under "${key}": ${report}`, error);
    }
  }
}

import { Logger } from '@nestjs/common';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';

export type SessionEventsListener = (session: SessionPlayingTracks) => void;

/**
 * Carries "this session's playing tracks changed" from the instance that handled the Maestro's write
 * to the instances holding the listeners' streams.
 *
 * The Maestro and the audience do not land on the same instance, so an in-process event bus is only
 * enough while there is a single instance. A broker delivers to **every** subscriber, including the
 * one on the publishing instance, so callers never have to special-case their own events.
 */
export interface SessionEventsBroker {
  /** Used in logs only. */
  readonly name: string;

  publish(session: SessionPlayingTracks): Promise<void>;

  /** Registers the single listener that feeds this instance's streams. */
  subscribe(listener: SessionEventsListener): Promise<void>;

  close(): Promise<void>;
}

/**
 * Delivers events inside one process. Correct for local dev and the e2e tests, where there is only
 * one instance, and a silent lie as soon as there are two — which is why production configures the
 * Redis broker instead.
 */
export class InProcessSessionEventsBroker implements SessionEventsBroker {
  readonly name = 'in-process';
  private readonly logger = new Logger(InProcessSessionEventsBroker.name);
  private listener: SessionEventsListener | null = null;

  async publish(session: SessionPlayingTracks): Promise<void> {
    this.listener?.(session);
  }

  async subscribe(listener: SessionEventsListener): Promise<void> {
    this.logger.log('session events are delivered in-process, this only works with a single instance');
    this.listener = listener;
  }

  async close(): Promise<void> {
    this.listener = null;
  }
}

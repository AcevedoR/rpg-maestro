import { Logger } from '@nestjs/common';
import { SessionID } from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionStreamsRegistry } from './session-streams.registry';

export const SESSION_LISTENERS_PRESENCE = 'SESSION_LISTENERS_PRESENCE';

/**
 * Answers "how many players are listening to each session, across the whole deployment".
 *
 * {@link SessionStreamsRegistry} only knows about the streams *this* instance is holding, and
 * listeners of one session land on any instance behind the load balancer — so a cluster-wide count
 * needs every instance to report its share somewhere the others can read it.
 */
export interface SessionListenersPresence {
  /** Used in logs only. */
  readonly name: string;

  /** Listener counts per session, deployment-wide. Missing sessions have zero listeners. */
  countsBySession(): Promise<Record<SessionID, number>>;

  close(): Promise<void>;
}

/**
 * Reads the local registry directly. Correct for local dev and the e2e tests, where there is only one
 * instance and local therefore *is* deployment-wide — and an undercount as soon as there are two,
 * which is why production configures the Redis-backed presence instead.
 */
export class InProcessSessionListenersPresence implements SessionListenersPresence {
  readonly name = 'in-process';
  private readonly logger = new Logger(InProcessSessionListenersPresence.name);

  constructor(private readonly registry: SessionStreamsRegistry) {
    this.logger.log('listener presence is read in-process, this only works with a single instance');
  }

  async countsBySession(): Promise<Record<SessionID, number>> {
    return this.registry.countsBySession();
  }

  async close(): Promise<void> {
    // nothing to release
  }
}

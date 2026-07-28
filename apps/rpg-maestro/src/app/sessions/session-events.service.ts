import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionEventsBroker } from './session-events.broker';

export const SESSION_EVENTS_BROKER = 'SESSION_EVENTS_BROKER';

/**
 * The push side of playback state: what the Maestro writes, streamed to the listeners of that session
 * wherever they are connected.
 *
 * Events are whole snapshots rather than diffs, so a client that missed one is still correct after the
 * next, and the fallback poll and the stream can be handled by exactly the same code on the client.
 */
@Injectable()
export class SessionEventsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SessionEventsService.name);
  private readonly events = new Subject<SessionPlayingTracks>();

  constructor(@Inject(SESSION_EVENTS_BROKER) private readonly broker: SessionEventsBroker) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.broker.subscribe((session) => this.events.next(session));
  }

  async onModuleDestroy(): Promise<void> {
    this.events.complete();
    await this.broker.close();
  }

  /** Announces a change to every instance. Never throws: the write it reports already happened. */
  async publish(session: SessionPlayingTracks): Promise<void> {
    try {
      await this.broker.publish(session);
    } catch (error) {
      this.logger.warn(`could not announce the change of session "${session.sessionId}"`, error);
    }
  }

  observe(sessionId: string): Observable<SessionPlayingTracks> {
    return this.events.pipe(filter((session) => session.sessionId === sessionId));
  }
}

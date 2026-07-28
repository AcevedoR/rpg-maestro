import { firstValueFrom, toArray } from 'rxjs';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionEventsService } from './session-events.service';
import { InProcessSessionEventsBroker, SessionEventsBroker, SessionEventsListener } from './session-events.broker';

function sessionState(sessionId: string, trackId: string): SessionPlayingTracks {
  return {
    sessionId,
    currentTrack: new PlayingTrack(trackId, trackId, 'url', 120000, false, 1730000000000, 0),
    shortEffectTrack: null,
  };
}

describe('SessionEventsService', () => {
  it('streams the changes of the observed session', async () => {
    const service = new SessionEventsService(new InProcessSessionEventsBroker());
    await service.onApplicationBootstrap();

    const received = firstValueFrom(service.observe('session-a'));
    await service.publish(sessionState('session-a', 'track-1'));

    expect((await received).currentTrack?.id).toBe('track-1');
  });

  it('does not leak one session changes into another session stream', async () => {
    const service = new SessionEventsService(new InProcessSessionEventsBroker());
    await service.onApplicationBootstrap();

    const received = firstValueFrom(service.observe('session-a').pipe(toArray()));
    await service.publish(sessionState('session-b', 'track-b'));
    await service.publish(sessionState('session-a', 'track-a'));
    await service.onModuleDestroy();

    expect((await received).map((session) => session.currentTrack?.id)).toEqual(['track-a']);
  });

  it('does not fail the write it reports when the broker is broken', async () => {
    const brokenBroker: SessionEventsBroker = {
      name: 'broken',
      publish: () => Promise.reject(new Error('pub/sub is down')),
      subscribe: async (_listener: SessionEventsListener) => undefined,
      close: async () => undefined,
    };
    const service = new SessionEventsService(brokenBroker);
    await service.onApplicationBootstrap();

    // A track change that made it to the database must not be reported as failed just because the
    // listeners could not be told about it — they still have their fallback poll.
    await expect(service.publish(sessionState('session-a', 'track-1'))).resolves.toBeUndefined();
  });
});

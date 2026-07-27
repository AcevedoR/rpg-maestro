import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionsCache } from './sessions.cache';

/**
 * Keyv serializes to JSON on every tier, including the in-process one used here, so a session put in as a
 * tree of class instances comes back out as plain objects. Anything that then calls a method on one of its
 * tracks — as the API does to resolve the playhead — dies with "getCurrentPlayTime is not a function".
 */
describe('SessionsCache', () => {
  function aSession(sessionId: string): SessionPlayingTracks {
    return {
      sessionId,
      currentTrack: new PlayingTrack('track-1', 'Track One', 'url', 120000, false, 1730000000000, 5000, 3),
      shortEffectTrack: new PlayingTrack('fx-1', 'Door Slam', 'fx-url', 2000, false, 1730000000000, 0, 3),
      revision: 3,
    };
  }

  it('returns tracks that still have their methods after a cache round-trip', async () => {
    const cache = new SessionsCache();
    await cache.set(aSession('session-round-trip'));

    const cached = await cache.get('session-round-trip');

    expect(cached).toBeDefined();
    expect(cached?.currentTrack?.getCurrentPlayTime(1730000010000)).toBe(15000);
    expect(cached?.shortEffectTrack?.getCurrentPlayTime(1730000000000)).toBe(0);
  });

  it('preserves the revision through the round-trip, since sync detection depends on it', async () => {
    const cache = new SessionsCache();
    await cache.set(aSession('session-revision'));

    const cached = await cache.get('session-revision');

    expect(cached?.revision).toBe(3);
    expect(cached?.currentTrack?.revision).toBe(3);
  });

  it('returns undefined for an unknown session rather than an empty shell', async () => {
    const cache = new SessionsCache();

    expect(await cache.get('never-stored')).toBeUndefined();
  });
});

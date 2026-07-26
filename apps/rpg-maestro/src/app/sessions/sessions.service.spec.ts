import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { SessionsService } from './sessions.service';
import { TracksDatabase } from '../maestro-api/TracksDatabase';
import { SESSIONS_NEGATIVE_CACHE_TTL, SessionsCache } from './sessions.cache';

const aPlayingTrack = (trackId: string): PlayingTrack => ({
  id: trackId,
  name: trackId,
  url: `http://localhost/${trackId}.mp3`,
  duration: 1000,
  isPaused: false,
  playTimestamp: 42,
  trackStartTime: 0,
});

let databases: DatabaseWrapperConfiguration;
let tracksDatabase: TracksDatabase;
let sessionsService: SessionsService;

beforeEach(() => {
  databases = new DatabaseWrapperConfiguration('in-memory');
  tracksDatabase = databases.getTracksDB();
  sessionsService = new SessionsService(databases);
});

describe('SessionsService negative caching', () => {
  it('should only hit the database once for an unknown session, even when polled repeatedly', async () => {
    const getSessionSpy = vi.spyOn(tracksDatabase, 'getSession');

    expect(await sessionsService.get('does-not-exist')).toBeNull();
    expect(await sessionsService.get('does-not-exist')).toBeNull();
    expect(await sessionsService.get('does-not-exist')).toBeNull();

    expect(getSessionSpy).toHaveBeenCalledTimes(1);
  });

  it('should keep hitting the database only once for a session that exists', async () => {
    await sessionsService.create('existing-session');
    const getSessionSpy = vi.spyOn(tracksDatabase, 'getSession');

    expect((await sessionsService.get('existing-session')).sessionId).toEqual('existing-session');
    expect((await sessionsService.get('existing-session')).sessionId).toEqual('existing-session');

    expect(getSessionSpy).not.toHaveBeenCalled();
  });

  it('should replace the negative entry when the session is created', async () => {
    expect(await sessionsService.get('session-to-create')).toBeNull();

    await sessionsService.create('session-to-create');

    const session = await sessionsService.get('session-to-create');
    expect(session).not.toBeNull();
    expect(session.sessionId).toEqual('session-to-create');
  });

  it('should replace the negative entry when the current track is upserted', async () => {
    expect(await sessionsService.get('session-to-play')).toBeNull();

    await sessionsService.upsertCurrentTrack('session-to-play', aPlayingTrack('track-1'));

    const session = await sessionsService.get('session-to-play');
    expect(session).not.toBeNull();
    expect(session.currentTrack.id).toEqual('track-1');
  });

  it('should replace the negative entry when a short effect track is upserted', async () => {
    expect(await sessionsService.get('session-with-effect')).toBeNull();

    await sessionsService.upsertShortEffectTrack('session-with-effect', aPlayingTrack('effect-1'));

    const session = await sessionsService.get('session-with-effect');
    expect(session).not.toBeNull();
    expect(session.shortEffectTrack.id).toEqual('effect-1');
  });

  it('should ask the database again once the negative entry expired', async () => {
    vi.useFakeTimers();
    try {
      const getSessionSpy = vi.spyOn(tracksDatabase, 'getSession');

      expect(await sessionsService.get('later-created-session')).toBeNull();
      expect(getSessionSpy).toHaveBeenCalledTimes(1);

      // the session gets created by another instance, which cannot invalidate our negative entry
      await tracksDatabase.createSession('later-created-session');
      expect(await sessionsService.get('later-created-session')).toBeNull();
      expect(getSessionSpy).toHaveBeenCalledTimes(1);

      vi.setSystemTime(Date.now() + SESSIONS_NEGATIVE_CACHE_TTL + 1);

      const session = await sessionsService.get('later-created-session');
      expect(session).not.toBeNull();
      expect(session.sessionId).toEqual('later-created-session');
      expect(getSessionSpy).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('SessionsCache', () => {
  it('should use a short ttl for negative entries and the long one for positive entries', async () => {
    vi.useFakeTimers();
    try {
      const cache = new SessionsCache();
      await cache.setAbsent('absent-session');
      await cache.set({ sessionId: 'present-session', currentTrack: null, shortEffectTrack: null });

      expect(await cache.get('absent-session')).toBeNull();
      expect(await cache.get('present-session')).not.toBeUndefined();

      vi.setSystemTime(Date.now() + SESSIONS_NEGATIVE_CACHE_TTL + 1);

      // the negative entry is gone, so the next lookup asks the database again
      expect(await cache.get('absent-session')).toBeUndefined();
      // while the positive entry, with its 1 day ttl, is still cached
      expect(await cache.get('present-session')).not.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should distinguish "nothing cached" (undefined) from "known absent" (null)', async () => {
    const cache = new SessionsCache();

    expect(await cache.get('never-seen-session')).toBeUndefined();

    await cache.setAbsent('never-seen-session');
    expect(await cache.get('never-seen-session')).toBeNull();
  });
});

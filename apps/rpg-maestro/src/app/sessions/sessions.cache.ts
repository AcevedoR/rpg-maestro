import Keyv from 'keyv';
import ms from 'ms';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';

export const SESSIONS_CACHE_TTL = ms('1 day');

/**
 * TTL for negative entries ("this session does not exist"), deliberately much shorter than the
 * positive TTL. A negative entry is a promise that the key is absent, and that promise goes stale
 * the instant someone creates the session. The cache is per-process today (see the TODO in
 * SessionsService), so another instance creating a session cannot invalidate our negative entry:
 * the TTL is the only bound on that staleness window. A few seconds is enough to absorb the
 * 1-request-per-second player polling while keeping a wrongly cached 404 self-healing quickly.
 */
export const SESSIONS_NEGATIVE_CACHE_TTL = ms('10 seconds');

/**
 * Three distinct states, do not collapse them:
 * - `undefined`: nothing is cached, the caller must ask the database
 * - `null`: the database confirmed the session does not exist (negative entry)
 * - a `SessionPlayingTracks`: cached value
 */
export type CachedSession = SessionPlayingTracks | null | undefined;

export class SessionsCache {
  private cache: Keyv<SessionPlayingTracks | null>;

  constructor() {
    this.cache = new Keyv<SessionPlayingTracks | null>({
      namespace: 'rpg_maestro_sessions',
      ttl: SESSIONS_CACHE_TTL,
    });
  }

  async get(sessionId: string): Promise<CachedSession> {
    return await this.cache.get(sessionId);
  }

  async set(session: SessionPlayingTracks): Promise<void> {
    await this.cache.set(session.sessionId, session, SESSIONS_CACHE_TTL);
  }

  /** Remembers that the database has no such session, so we stop querying it on every poll. */
  async setAbsent(sessionId: string): Promise<void> {
    await this.cache.set(sessionId, null, SESSIONS_NEGATIVE_CACHE_TTL);
  }
}

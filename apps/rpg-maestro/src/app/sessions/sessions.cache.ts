import ms from 'ms';
import { rehydrateSessionPlayingTracks, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { ResilientCache } from '../infrastructure/cache/resilient-cache';
import { createCacheTiers } from '../infrastructure/cache/cache-tiers.factory';

export class SessionsCache {
  private cache: ResilientCache<SessionPlayingTracks>;

  constructor() {
    this.cache = new ResilientCache(createCacheTiers<SessionPlayingTracks>('rpg_maestro_sessions', ms('1 day')));
  }

  async get(sessionId: string): Promise<SessionPlayingTracks | undefined> {
    const cached = await this.cache.get(sessionId);
    if (!cached) {
      return undefined;
    }
    // Keyv serializes to JSON on every tier, including the in-process one, so what comes back has the right
    // fields but no prototype. Callers get a SessionPlayingTracks from this method and are entitled to call
    // methods on its tracks, so the rehydration belongs here rather than in each of them.
    return rehydrateSessionPlayingTracks(cached);
  }

  async set(session: SessionPlayingTracks): Promise<void> {
    await this.cache.set(session.sessionId, session);
  }
}

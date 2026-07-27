import ms from 'ms';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { ResilientCache } from '../infrastructure/cache/resilient-cache';
import { createCacheTiers } from '../infrastructure/cache/cache-tiers.factory';

export class SessionsCache {
  private cache: ResilientCache<SessionPlayingTracks>;

  constructor() {
    this.cache = new ResilientCache(createCacheTiers<SessionPlayingTracks>('rpg_maestro_sessions', ms('1 day')));
  }

  async get(sessionId: string): Promise<SessionPlayingTracks | undefined> {
    return await this.cache.get(sessionId);
  }

  async set(session: SessionPlayingTracks): Promise<void> {
    await this.cache.set(session.sessionId, session);
  }
}

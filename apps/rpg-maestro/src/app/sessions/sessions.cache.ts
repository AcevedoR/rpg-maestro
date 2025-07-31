import Keyv from 'keyv';
import ms from 'ms';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';

export class SessionsCache {
  private cache: Keyv<SessionPlayingTracks>;

  constructor() {
    this.cache = new Keyv<SessionPlayingTracks>({
      namespace: 'rpg_maestro_sessions',
      ttl: ms('1 day'),
    });
  }

  async get(sessionId: string): Promise<SessionPlayingTracks | undefined> {
    return await this.cache.get(sessionId);
  }

  async set(session: SessionPlayingTracks): Promise<void> {
    await this.cache.set(session.sessionId, session);
  }
}

import { Controller, Get, Inject, Param } from '@nestjs/common';
import { SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Milliseconds } from 'cache-manager';
import { PlayersService } from './players-api/players-service';

const ONE_DAY_TTL: Milliseconds = 1000 * 60 * 60 * 24;

@Controller()
export class PlayersController {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, @Inject() private playerService: PlayersService) {}

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.playerService.getTrack(id);
  }

  @Get('/sessions/:id/playing-tracks')
  async getSessionTracks(@Param('id') sessionId: string): Promise<SessionPlayingTracks> {
    // TODO fix this hack forbidding having more than one instance
    // this was done to avoid reaching Firestore quotas
    const cachedValue = (await this.cacheManager.get(sessionId)) as SessionPlayingTracks;
    if (cachedValue) {
      return Promise.resolve(cachedValue);
    }
    const dbValue = await this.playerService.getSessionPlayingTracks(sessionId);
    await this.cacheManager.set(sessionId, dbValue, ONE_DAY_TTL);
    return dbValue;
  }
}

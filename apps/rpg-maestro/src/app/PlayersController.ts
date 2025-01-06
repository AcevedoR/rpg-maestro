import { Controller, Get, Inject, Param } from '@nestjs/common';
import { TrackService } from './maestro-api/TrackService';
import { Database } from './maestro-api/Database';
import { SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Milliseconds } from 'cache-manager';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';
import { RunningJobsDatabase } from './maestro-api/RunningJobsDatabase';

const ONE_DAY_TTL: Milliseconds = 1000 * 60 * 60 * 24;

@Controller()
export class PlayersController {
  private readonly database: Database;
  private readonly trackService: TrackService;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseWrapper: DatabaseWrapperConfiguration,
    @Inject(RunningJobsDatabase) private readonly runningJobsDatabase: RunningJobsDatabase// TODO remove and split track service
  ) {
    this.database = databaseWrapper.get();
    this.trackService = new TrackService(this.database, runningJobsDatabase);
  }

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.trackService.get(id);
  }

  @Get('/sessions/:id/playing-tracks')
  async getSessionTracks(@Param('id') sessionId: string): Promise<SessionPlayingTracks> {
    // TODO fix this hack forbidding having more than one instance
    // this was done to avoid reaching Firestore quotas
    const cachedValue = (await this.cacheManager.get(sessionId)) as SessionPlayingTracks;
    if (cachedValue) {
      return Promise.resolve(cachedValue);
    }
    const dbValue = await this.trackService.getSessionPlayingTracks(sessionId);
    await this.cacheManager.set(sessionId, dbValue, ONE_DAY_TTL);
    return dbValue;
  }
}

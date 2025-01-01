import { Body, Controller, Get, Inject, Logger, Param, Post, Put } from '@nestjs/common';
import { TrackService } from './maestro-api/TrackService';
import { Database } from './maestro-api/Database';
import { ManageCurrentlyPlayingTracks } from './maestro-api/ManageCurrentlyPlayingTracks';
import {
  ChangeSessionPlayingTracksRequest,
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TracksFromDirectoryCreation,
  TrackUpdate, UploadAndCreateTracksFromYoutubeRequest
} from '@rpg-maestro/rpg-maestro-api-contract';
import { FirestoreDatabase } from './infrastructure/FirestoreDatabase';
import * as process from 'node:process';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Milliseconds } from 'cache-manager';

const ONE_DAY_TTL: Milliseconds = 1000 * 60 * 60 * 24;

@Controller()
export class AppController {
  private readonly database: Database;
  private readonly trackService: TrackService;
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    const databaseImpl: string | undefined = process.env.DATABASE;
    if (databaseImpl === 'firestore') {
      Logger.log('using firestore as database');
      this.database = new FirestoreDatabase();
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      this.database = new InMemoryDatabase();
      Logger.log('using in-memory database');
    } else {
      throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
    }
    this.trackService = new TrackService(this.database);
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-directory')
  createAllTracksFromDirectory(
    @Param('sessionId') sessionId: string,
    @Body() tracksFromDirectoryCreation: TracksFromDirectoryCreation
  ): Promise<void> {
    Logger.log(
      `importing tracks for session ${tracksFromDirectoryCreation.sessionId} from: ${tracksFromDirectoryCreation}`
    );
    return this.trackService.createAllTracksFromDirectory(sessionId, tracksFromDirectoryCreation);
  }

  // @Put('/maestro/sessions/:sessionId/tracks/from-youtube')
  // uploadAndCreateTracksFromYoutube(
  //   @Param('sessionId') sessionId: string,
  //   @Body() uploadTrackFromYoutubeRequest: UploadAndCreateTracksFromYoutubeRequest
  // ): Promise<Track> {
  //   return this.trackService.updateTrack(id, trackUpdate);
  // }

  @Post('/maestro/sessions/:sessionId/tracks')
  postTrack(@Param('sessionId') sessionId: string, @Body() trackCreation: TrackCreation): Promise<Track> {
    return this.trackService.createTrack(sessionId, trackCreation);
  }

  @Put('/maestro/sessions/:sessionId/tracks/:trackId')
  updateTrack(
    @Param('sessionId') sessionId: string,
    @Param('trackId') id: string,
    @Body() trackUpdate: TrackUpdate
  ): Promise<Track> {
    return this.trackService.updateTrack(id, trackUpdate);
  }

  @Get('/maestro/sessions/:sessionId/tracks')
  getAllTracks(@Param('sessionId') sessionId: string): Promise<Track[]> {
    return this.trackService.getAll(sessionId);
  }

  @Put('/maestro/sessions/:sessionId/playing-tracks')
  async changeCurrentTrack(
    @Param('sessionId') sessionId: string,
    @Body() changeSessionPlayingTracks: ChangeSessionPlayingTracksRequest
  ): Promise<SessionPlayingTracks> {
    const playingTrack = await this.manageCurrentlyPlayingTracks.changeSessionPlayingTracks(
      sessionId,
      changeSessionPlayingTracks
    );
    await this.cacheManager.set(sessionId, playingTrack, ONE_DAY_TTL);
    return playingTrack;
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

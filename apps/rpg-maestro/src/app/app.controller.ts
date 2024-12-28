import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { TrackService } from './admin-api/TrackService';
import { Database } from './admin-api/Database';
import { ManageCurrentlyPlayingTracks } from './admin-api/ManageCurrentlyPlayingTracks';
import {
  PlayingTrack,
  Track,
  TrackCreation,
  TracksFromDirectoryCreation,
  TrackToPlay,
  TrackUpdate,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DEFAULT_CURRENT_SESSION_ID, FirestoreDatabase } from './infrastructure/FirestoreDatabase';
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

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    const databaseImpl: string | undefined = process.env.DATABASE;
    if (databaseImpl === 'firestore') {
      console.log('using firestore as database');
      this.database = new FirestoreDatabase();
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      this.database = new InMemoryDatabase();
      console.log('using in-memory database');
    } else {
      throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
    }
    this.trackService = new TrackService(this.database);
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Post('/admin/tracks/directory')
  createAllTracksFromDirectory(@Body() tracksFromDirectoryCreation: TracksFromDirectoryCreation): Promise<void> {
    console.log(tracksFromDirectoryCreation);
    return this.trackService.createAllTracksFromDirectory(tracksFromDirectoryCreation);
  }

  @Post('/admin/tracks')
  postTrack(@Body() trackCreation: TrackCreation): Promise<Track> {
    return this.trackService.createTrack(trackCreation);
  }

  @Put('/admin/tracks/:id')
  updateTrack(@Param('id') id: string, @Body() trackUpdate: TrackUpdate): Promise<Track> {
    return this.trackService.updateTrack(id, trackUpdate);
  }

  @Get('/admin/tracks')
  getAllTracks(): Promise<Track[]> {
    return this.trackService.getAll();
  }

  @Put('/admin/sessions/current/tracks')
  async changeCurrentTrack(@Body() trackToPlay: TrackToPlay): Promise<PlayingTrack> {
    const playingTrack = await this.manageCurrentlyPlayingTracks.changeCurrentTrack(trackToPlay);
    await this.cacheManager.set(DEFAULT_CURRENT_SESSION_ID, playingTrack, ONE_DAY_TTL);
    return playingTrack;
  }

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.trackService.get(id);
  }

  @Get('/sessions/current/tracks')
  async getCurrentTrack(): Promise<PlayingTrack> {
    // TODO fix this hack forbidding having more than one instance
    // this was done to avoid reaching Firestore quotas
    const cachedValue = (await this.cacheManager.get(DEFAULT_CURRENT_SESSION_ID)) as PlayingTrack;
    if (cachedValue) {
      return Promise.resolve(cachedValue);
    }
    const dbValue = await this.trackService.getCurrentlyPlaying();
    await this.cacheManager.set(DEFAULT_CURRENT_SESSION_ID, dbValue, ONE_DAY_TTL);
    return dbValue;
  }
}

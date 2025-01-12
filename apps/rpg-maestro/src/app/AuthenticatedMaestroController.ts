import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Logger, Param, Post, Put } from '@nestjs/common';
import { TrackService } from './maestro-api/TrackService';
import { Database } from './maestro-api/Database';
import { ManageCurrentlyPlayingTracks } from './maestro-api/ManageCurrentlyPlayingTracks';
import {
  ChangeSessionPlayingTracksRequest,
  SessionPlayingTracks,
  Track,
  TrackCreation, TrackCreationFromYoutubeDto,
  TracksFromDirectoryCreation,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest
} from '@rpg-maestro/rpg-maestro-api-contract';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Milliseconds } from 'cache-manager';
import { ApiCookieAuth } from '@nestjs/swagger';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';
import { TrackCreationFromYoutubeJob } from './maestro-api/TrackCreationFromYoutubeJobsStore';

const ONE_DAY_TTL: Milliseconds = 1000 * 60 * 60 * 24;

@ApiCookieAuth()
@Controller()
export class AuthenticatedMaestroController {
  private readonly database: Database;
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseWrapper: DatabaseWrapperConfiguration,
    @Inject() private trackService: TrackService
  ) {
    this.database = databaseWrapper.get();
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-directory')
  createAllTracksFromDirectory(
    @Param('sessionId') sessionId: string,
    @Body() tracksFromDirectoryCreation: TracksFromDirectoryCreation
  ): Promise<void> {
    Logger.log(`importing tracks for session ${sessionId} from: ${tracksFromDirectoryCreation}`);
    return this.trackService.createAllTracksFromDirectory(sessionId, tracksFromDirectoryCreation);
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-youtube')
  @HttpCode(HttpStatus.ACCEPTED)
  uploadAndCreateTracksFromYoutube(
    @Param('sessionId') sessionId: string,
    @Body() uploadAndCreateTracksFromYoutubeRequest: UploadAndCreateTracksFromYoutubeRequest
  ): Promise<void> {
    return this.trackService.uploadAndCreateTrackFromYoutube(sessionId, uploadAndCreateTracksFromYoutubeRequest);
  }

  @Get('/maestro/sessions/:sessionId/tracks/from-youtube')
  getYoutubeTrackCreations(@Param('sessionId') sessionId: string): Promise<TrackCreationFromYoutubeDto[]> {
    return this.trackService.getTrackFromYoutubeCreations(sessionId);
  }

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
}

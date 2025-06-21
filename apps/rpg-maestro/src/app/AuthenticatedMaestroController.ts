import { Request } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  Put,
  Req
} from '@nestjs/common';
import { TrackService } from './maestro-api/TrackService';
import { OnboardingService } from './maestro-api/onboarding.service';
import { TracksDatabase } from './maestro-api/TracksDatabase';
import { ManageCurrentlyPlayingTracks } from './maestro-api/ManageCurrentlyPlayingTracks';
import {
  ChangeSessionPlayingTracksRequest,
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TrackCreationFromYoutubeDto,
  TracksFromDirectoryCreation,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest, User
} from '@rpg-maestro/rpg-maestro-api-contract';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Milliseconds } from 'cache-manager';
import { ApiCookieAuth } from '@nestjs/swagger';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';
import { getUser } from './AuthUtils';
import { UsersService } from './maestro-api/user.service';

const ONE_DAY_TTL: Milliseconds = 1000 * 60 * 60 * 24;

@ApiCookieAuth()
@Controller()
export class AuthenticatedMaestroController {
  private readonly database: TracksDatabase;
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseWrapper: DatabaseWrapperConfiguration,
    @Inject() private trackService: TrackService,
    @Inject() private onboardingService: OnboardingService,
    @Inject() private userService: UsersService,
  ) {
    this.database = databaseWrapper.getTracksDB();
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Get('/maestro')
  async getMaestroInfos(
    @Req() req: Request
  ): Promise<User> {
    const userId = getUser(req);
    const user = await this.userService.get(userId);
    if(!user){
      throw new HttpException(`Current user ${userId} not found in db`, HttpStatus.CONFLICT);
    }
    return user;
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

  @Post('/maestro/onboard')
  async createSession(@Req() req: Request): Promise<SessionPlayingTracks> {
    const userId = getUser(req);
    return Promise.resolve(this.onboardingService.createSession(userId));
  }
}

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
  Request,
  UseGuards,
} from '@nestjs/common';
import { TrackService } from './maestro-api/TrackService';
import { OnboardingService } from './maestro-api/onboarding.service';
import { TracksDatabase } from './maestro-api/TracksDatabase';
import { ManageCurrentlyPlayingTracks } from './maestro-api/ManageCurrentlyPlayingTracks';
import {
  ChangeSessionPlayingTracksRequest,
  CreateSession,
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TrackCreationFromYoutubeDto,
  TracksFromDirectoryCreation,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest,
  User,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Milliseconds } from 'cache-manager';
import { ApiCookieAuth } from '@nestjs/swagger';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';
import { UsersService } from './users-management/users.service';
import { AuthenticatedUser, JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Role } from './auth/role.enum';

const ONE_DAY_TTL: Milliseconds = 1000 * 60 * 60 * 24;

@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AuthenticatedMaestroController {
  private readonly database: TracksDatabase;
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseWrapper: DatabaseWrapperConfiguration,
    @Inject() private trackService: TrackService,
    @Inject() private onboardingService: OnboardingService,
    @Inject() private userService: UsersService
  ) {
    this.database = databaseWrapper.getTracksDB();
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Get('/maestro')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  async getMaestroInfos(@Request() req: {user: AuthenticatedUser}): Promise<User> {
    const user = await this.userService.get(req.user.id);
    if (!user) {
      throw new HttpException(`Current user ${req.user.id} not found in db`, HttpStatus.CONFLICT);
    }
    return user;
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-directory')
  @Roles([Role.MAESTRO])
  createAllTracksFromDirectory(
    @Param('sessionId') sessionId: string,
    @Body() tracksFromDirectoryCreation: TracksFromDirectoryCreation
  ): Promise<void> {
    Logger.log(`importing tracks for session ${sessionId} from: ${tracksFromDirectoryCreation}`);
    return this.trackService.createAllTracksFromDirectory(sessionId, tracksFromDirectoryCreation);
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-youtube')
  @Roles([Role.MAESTRO])
  @HttpCode(HttpStatus.ACCEPTED)
  uploadAndCreateTracksFromYoutube(
    @Param('sessionId') sessionId: string,
    @Body() uploadAndCreateTracksFromYoutubeRequest: UploadAndCreateTracksFromYoutubeRequest
  ): Promise<void> {
    return this.trackService.uploadAndCreateTrackFromYoutube(sessionId, uploadAndCreateTracksFromYoutubeRequest);
  }

  @Get('/maestro/sessions/:sessionId/tracks/from-youtube')
  @Roles([Role.MAESTRO])
  getYoutubeTrackCreations(@Param('sessionId') sessionId: string): Promise<TrackCreationFromYoutubeDto[]> {
    return this.trackService.getTrackFromYoutubeCreations(sessionId);
  }

  @Post('/maestro/sessions/:sessionId/tracks')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  postTrack(@Param('sessionId') sessionId: string, @Body() trackCreation: TrackCreation): Promise<Track> {
    return this.trackService.createTrack(sessionId, trackCreation);
  }

  @Put('/maestro/sessions/:sessionId/tracks/:trackId')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  updateTrack(
    @Param('sessionId') sessionId: string,
    @Param('trackId') id: string,
    @Body() trackUpdate: TrackUpdate
  ): Promise<Track> {
    return this.trackService.updateTrack(id, trackUpdate);
  }

  @Get('/maestro/sessions/:sessionId/tracks')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  getAllTracks(@Param('sessionId') sessionId: string): Promise<Track[]> {
    return this.trackService.getAll(sessionId);
  }

  @Put('/maestro/sessions/:sessionId/playing-tracks')
  @Roles([Role.MAESTRO, Role.MINSTREL])
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

  @Post('/maestro/sessions')
  @Roles([Role.MAESTRO])
  async createNewSession(
    @Request() req: { user: AuthenticatedUser },
    @Body() createSession: CreateSession
  ): Promise<SessionPlayingTracks> {
    const session = await this.onboardingService.createSession(createSession, req.user.id);
    await this.cacheManager.set(session.sessionId, session, ONE_DAY_TTL);
    return session;
  }

  @Post('/maestro/onboard')
  async createSession(@Request() req: {user: AuthenticatedUser}): Promise<SessionPlayingTracks> {
    return Promise.resolve(this.onboardingService.createNewUserWithSession(req.user.id));
  }
}

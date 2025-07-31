import {
  Body,
  Controller,
  ForbiddenException,
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
import { ApiCookieAuth } from '@nestjs/swagger';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';
import { UsersService } from './users-management/users.service';
import { AuthenticatedUser, JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Role } from './auth/role.enum';
import { SessionsService } from './sessions/sessions.service';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AuthenticatedMaestroController {
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(
    @Inject() databaseWrapper: DatabaseWrapperConfiguration,
    @Inject() sessionsService: SessionsService,
    @Inject() private trackService: TrackService,
    @Inject() private onboardingService: OnboardingService,
    @Inject() private userService: UsersService
  ) {
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(
      databaseWrapper.getTracksDB(),
      sessionsService
    );
  }

  @Get('/maestro')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  async getMaestroInfos(@Request() req: { user: AuthenticatedUser }): Promise<User> {
    const user = await this.userService.get(req.user.id);
    if (!user) {
      throw new HttpException(`Current user ${req.user.id} not found in db`, HttpStatus.CONFLICT);
    }
    return user;
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-directory')
  @Roles([Role.MAESTRO])
  async createAllTracksFromDirectory(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string,
    @Body() tracksFromDirectoryCreation: TracksFromDirectoryCreation
  ): Promise<void> {
    await this.checkAccessOnSession(req.user, sessionId);
    Logger.log(`importing tracks for session ${sessionId} from: ${tracksFromDirectoryCreation}`);
    return this.trackService.createAllTracksFromDirectory(sessionId, tracksFromDirectoryCreation);
  }

  @Post('/maestro/sessions/:sessionId/tracks/from-youtube')
  @Roles([Role.MAESTRO])
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadAndCreateTracksFromYoutube(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string,
    @Body() uploadAndCreateTracksFromYoutubeRequest: UploadAndCreateTracksFromYoutubeRequest
  ): Promise<void> {
    await this.checkAccessOnSession(req.user, sessionId);
    return this.trackService.uploadAndCreateTrackFromYoutube(sessionId, uploadAndCreateTracksFromYoutubeRequest);
  }

  @Get('/maestro/sessions/:sessionId/tracks/from-youtube')
  @Roles([Role.MAESTRO])
  async getYoutubeTrackCreations(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string
  ): Promise<TrackCreationFromYoutubeDto[]> {
    await this.checkAccessOnSession(req.user, sessionId);
    return this.trackService.getTrackFromYoutubeCreations(sessionId);
  }

  @Post('/maestro/sessions/:sessionId/tracks')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  async postTrack(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string,
    @Body() trackCreation: TrackCreation
  ): Promise<Track> {
    await this.checkAccessOnSession(req.user, sessionId);
    return this.trackService.createTrack(sessionId, trackCreation);
  }

  @Put('/maestro/sessions/:sessionId/tracks/:trackId')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  async updateTrack(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string,
    @Param('trackId') id: string,
    @Body() trackUpdate: TrackUpdate
  ): Promise<Track> {
    await this.checkAccessOnSession(req.user, sessionId);
    return this.trackService.updateTrack(id, trackUpdate);
  }

  @Get('/maestro/sessions/:sessionId/tracks')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  async getAllTracks(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string
  ): Promise<Track[]> {
    await this.checkAccessOnSession(req.user, sessionId);
    return this.trackService.getAll(sessionId);
  }

  @Put('/maestro/sessions/:sessionId/playing-tracks')
  @Roles([Role.MAESTRO, Role.MINSTREL])
  async changeCurrentTrack(
    @Request() req: { user: AuthenticatedUser },
    @Param('sessionId') sessionId: string,
    @Body() changeSessionPlayingTracks: ChangeSessionPlayingTracksRequest
  ): Promise<SessionPlayingTracks> {
    await this.checkAccessOnSession(req.user, sessionId);
    return await this.manageCurrentlyPlayingTracks.changeSessionPlayingTracks(sessionId, changeSessionPlayingTracks);
  }

  @Post('/maestro/sessions')
  @Roles([Role.MAESTRO])
  async createNewSession(
    @Request() req: { user: AuthenticatedUser },
    @Body() createSession: CreateSession
  ): Promise<SessionPlayingTracks> {
    return await this.onboardingService.createSession(createSession, req.user.id);
  }

  @Post('/maestro/onboard')
  async createSession(@Request() req: { user: AuthenticatedUser }): Promise<SessionPlayingTracks> {
    return await this.onboardingService.createNewUserWithSession(req.user.id);
  }

  async checkAccessOnSession(reqUser: AuthenticatedUser, sessionId: string) {
    const user = await this.userService.get(reqUser.id);
    if (!user.sessions || !user.sessions[sessionId]) {
      throw new ForbiddenException('Forbidden. No access to this session');
    }
  }
}

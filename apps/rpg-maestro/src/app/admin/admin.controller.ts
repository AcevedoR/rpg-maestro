import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Put,
  UseGuards
} from '@nestjs/common';
import {
  AdminSessionOverview,
  parseAndValidateDto,
  SessionID,
  SessionPlayingTracks,
  User,
  UserID,
  UpdateUserRole
} from '@rpg-maestro/rpg-maestro-api-contract';
import { Role } from '../auth/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionsService } from '../sessions/sessions.service';
import { SESSION_LISTENERS_PRESENCE, SessionListenersPresence } from '../sessions/session-listeners-presence';
import { UsersService } from '../users-management/users.service';

@Controller('maestro/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    @Inject(SessionsService) private readonly sessionsService: SessionsService,
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(SESSION_LISTENERS_PRESENCE) private readonly listenersPresence: SessionListenersPresence
  ) {}

  @Get('/sessions')
  @Roles([Role.ADMIN])
  async getAllSessions(): Promise<SessionPlayingTracks[]> {
    return this.sessionsService.getAll();
  }

  @Get('/sessions/overview')
  @Roles([Role.ADMIN])
  async getSessionsOverview(): Promise<AdminSessionOverview[]> {
    const [sessions, users, listenersBySession] = await Promise.all([
      this.sessionsService.getAll(),
      this.usersService.getAll(),
      this.listenersPresence.countsBySession(),
    ]);
    const gmsBySession = new Map<SessionID, UserID[]>();
    for (const user of users) {
      for (const sessionId of Object.keys(user.sessions ?? {})) {
        gmsBySession.set(sessionId, [...(gmsBySession.get(sessionId) ?? []), user.id]);
      }
    }
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      gms: gmsBySession.get(session.sessionId) ?? [],
      connectedPlayers: listenersBySession[session.sessionId] ?? 0,
      currentTrack: session.currentTrack,
    }));
  }

  @Get('/users')
  @Roles([Role.ADMIN])
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get('/users/:userId')
  @Roles([Role.ADMIN])
  async getUser(
    @Param('userId') userId: string,
  ): Promise<User> {
    return this.usersService.get(userId);
  }

  @Put('/users/:userId/role')
  @Roles([Role.ADMIN])
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() updateUserRole: UpdateUserRole
  ): Promise<void> {
    const updateUserRoleValidated = await parseAndValidateDto(UpdateUserRole, updateUserRole);
    const user = await this.usersService.get(userId);
    if(!user){
      throw new NotFoundException(`no user '${userId}' found`);
    }
    if(user.role === Role.ADMIN){
      throw new BadRequestException(`cannot change Admin role '${userId}'`);
    }
    if(updateUserRoleValidated.role === Role.ADMIN){
      throw new BadRequestException(`cannot give Admin role`)
    }
    user.role = updateUserRoleValidated.role;
    await this.usersService.save(user);
  }
}

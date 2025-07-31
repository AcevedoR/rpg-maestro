import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { Role } from '../auth/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionsService } from '../sessions/sessions.service';

@Controller('maestro/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('/sessions')
  @Roles([Role.ADMIN])
  async getAllSessions(): Promise<SessionPlayingTracks[]> {
    return this.sessionsService.getAll();
  }
}

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
  parseAndValidateDto,
  SessionPlayingTracks,
  User,
  UpdateUserRole
} from '@rpg-maestro/rpg-maestro-api-contract';
import { Role } from '../auth/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users-management/users.service';

@Controller('maestro/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(@Inject(SessionsService) private readonly sessionsService: SessionsService, @Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('/sessions')
  @Roles([Role.ADMIN])
  async getAllSessions(): Promise<SessionPlayingTracks[]> {
    return this.sessionsService.getAll();
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

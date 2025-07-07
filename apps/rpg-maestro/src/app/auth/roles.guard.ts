import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { Roles } from './roles.decorator';
import { UsersService } from '../users-management/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.id) {
      throw new ForbiddenException('Forbidden. User not authenticated.');
    }
    const dbUser = await this.usersService.get(user.id);
    if (!dbUser || !dbUser.role) {
      Logger.log(`RolesGuard unhandled case: dbUser for id: ${user.id} not found or no role: ${dbUser?.role}`);
      throw new ForbiddenException('Forbidden. User roles not found');
    }
    if (dbUser.role === 'ADMIN') {
      return true;
    }
    if (!requiredRoles.includes(dbUser.role as Role)) {
      throw new ForbiddenException('Forbidden. Insufficient privileges');
    }
    return true;
  }
}

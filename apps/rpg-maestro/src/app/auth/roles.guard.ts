import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { UsersDatabase } from '../user-management/users-database';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  usersDatabase: UsersDatabase;

  constructor(
    private reflector: Reflector,
    @Inject(DatabaseWrapperConfiguration) private databaseWrapper: DatabaseWrapperConfiguration
  ) {
    this.usersDatabase = databaseWrapper.getUsersDB();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.id) {
      throw new ForbiddenException('Forbidden. User not authenticated.');
    }
    const dbUser = await this.usersDatabase.get(user.id); // FIXME TODO cache this
    if (!dbUser || !dbUser.role) {
      throw new ForbiddenException('Forbidden. Insufficient privileges');
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

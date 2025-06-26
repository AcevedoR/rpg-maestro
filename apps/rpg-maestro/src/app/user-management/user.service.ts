import { Inject, Injectable } from '@nestjs/common';
import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { UsersDatabase } from './users-database';

@Injectable()
export class UsersService {
  usersDatabase: UsersDatabase;

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.usersDatabase = databaseWrapper.getUsersDB();
  }

  async get(userId: UserID): Promise<User | null> {
    return await this.usersDatabase.get(userId);
  }
}

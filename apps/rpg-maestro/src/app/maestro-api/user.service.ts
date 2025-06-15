import { Inject, Injectable } from '@nestjs/common';
import { UsersDatabase } from './UsersDatabase';
import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';

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

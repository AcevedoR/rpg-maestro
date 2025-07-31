import { Inject, Injectable } from '@nestjs/common';
import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { UsersDatabase } from './users-database';
import { UsersCache } from './users.cache';

@Injectable()
export class UsersService {
  private usersDatabase: UsersDatabase;
  private cache = new UsersCache();

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.usersDatabase = databaseWrapper.getUsersDB();
  }

  async get(userId: UserID): Promise<User | null> {
    const cachedUser = await this.cache.get(userId);
    if (cachedUser) {
      return cachedUser;
    }
    const userFromDB = await this.usersDatabase.get(userId);
    if (userFromDB != null) {
      await this.cache.set(userFromDB);
    }
    return userFromDB;
  }

  async save(user: User): Promise<void> {
    await this.usersDatabase.save(user);
    await this.cache.set(user);
  }

  // for admin only
  async getAll(): Promise<User[]>{
    return this.usersDatabase.getAll();
  }
}

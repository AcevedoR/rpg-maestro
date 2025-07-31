import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { UsersDatabase } from '../../../users-management/users-database';

@Injectable()
export class InMemoryUsersDatabase implements UsersDatabase {
  db: Map<UserID, User> = new Map<UserID, User>();

  save(user: User) {
    this.db.set(user.id, user);
    return Promise.resolve();
  }

  get(userId: UserID): Promise<User | null> {
    return Promise.resolve(this.db.get(userId));
  }

  getAll(): Promise<User[]>{
    return Promise.resolve([...this.db.values()]);
  }
}

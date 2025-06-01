import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { UsersDatabase } from '../../../maestro-api/UsersDatabase';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryUsersDatabase implements UsersDatabase {
  db: Map<UserID, User> = new Map<UserID, User>();

  save (user: User) {
    this.db.set(user.id, user);
    return Promise.resolve();
  };

  get(userId: UserID): Promise<User> {
    return Promise.resolve(this.db.get(userId));
  }
}

import Keyv from 'keyv';
import ms from 'ms';
import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';

export class UsersCache {
  private cache: Keyv<User>;

  constructor() {
    this.cache = new Keyv<User>({
      namespace: 'rpg_maestro_users',
      ttl: ms('1 day'),
    });
  }

  async get(userId: UserID): Promise<User | undefined> {
    return await this.cache.get(userId);
  }

  async set(user: User): Promise<void> {
    await this.cache.set(user.id, user);
  }
}

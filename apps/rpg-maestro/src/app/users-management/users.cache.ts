import ms from 'ms';
import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { ResilientCache } from '../infrastructure/cache/resilient-cache';
import { createCacheTiers } from '../infrastructure/cache/cache-tiers.factory';

export class UsersCache {
  private cache: ResilientCache<User>;

  constructor() {
    this.cache = new ResilientCache(createCacheTiers<User>('rpg_maestro_users', ms('1 day')));
  }

  async get(userId: UserID): Promise<User | undefined> {
    return await this.cache.get(userId);
  }

  async set(user: User): Promise<void> {
    await this.cache.set(user.id, user);
  }
}

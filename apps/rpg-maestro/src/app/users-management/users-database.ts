import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';

export interface UsersDatabase {
  save: (user: User) => Promise<void>;
  get(userId: UserID): Promise<User | null>;
  getAll(): Promise<User[]>;
}


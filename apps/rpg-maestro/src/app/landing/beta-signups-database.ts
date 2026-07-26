import { BetaSignup } from '@rpg-maestro/rpg-maestro-api-contract';

export interface BetaSignupsDatabase {
  upsert(signup: BetaSignup): Promise<BetaSignup>;

  get(email: string): Promise<BetaSignup | null>;

  getAll(): Promise<BetaSignup[]>;
}

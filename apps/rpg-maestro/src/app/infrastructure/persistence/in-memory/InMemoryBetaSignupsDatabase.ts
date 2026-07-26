import { BetaSignup } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { BetaSignupsDatabase } from '../../../landing/beta-signups-database';

@Injectable()
export class InMemoryBetaSignupsDatabase implements BetaSignupsDatabase {
  private signups: Map<string, BetaSignup> = new Map();

  async upsert(signup: BetaSignup): Promise<BetaSignup> {
    this.signups.set(signup.email, signup);
    return Promise.resolve(signup);
  }

  async get(email: string): Promise<BetaSignup | null> {
    const signup = this.signups.get(email);
    return signup ? { ...signup } : null;
  }

  async getAll(): Promise<BetaSignup[]> {
    return Array.from(this.signups.values()).map((s) => ({ ...s }));
  }
}

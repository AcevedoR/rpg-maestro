import { UpgradeInterest } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { UpgradeInterestDatabase } from '../../../landing/upgrade-interest-database';

@Injectable()
export class InMemoryUpgradeInterestDatabase implements UpgradeInterestDatabase {
  private upgradeInterests: Map<string, UpgradeInterest> = new Map();

  async upsert(upgradeInterest: UpgradeInterest): Promise<UpgradeInterest> {
    this.upgradeInterests.set(upgradeInterest.email, upgradeInterest);
    return Promise.resolve(upgradeInterest);
  }

  async get(email: string): Promise<UpgradeInterest | null> {
    const upgradeInterest = this.upgradeInterests.get(email);
    return upgradeInterest ? { ...upgradeInterest } : null;
  }

  async getAll(): Promise<UpgradeInterest[]> {
    return Array.from(this.upgradeInterests.values()).map((u) => ({ ...u }));
  }
}

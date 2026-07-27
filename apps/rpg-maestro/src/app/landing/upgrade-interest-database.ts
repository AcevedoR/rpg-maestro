import { UpgradeInterest } from '@rpg-maestro/rpg-maestro-api-contract';

export interface UpgradeInterestDatabase {
  upsert(upgradeInterest: UpgradeInterest): Promise<UpgradeInterest>;

  get(email: string): Promise<UpgradeInterest | null>;

  getAll(): Promise<UpgradeInterest[]>;
}

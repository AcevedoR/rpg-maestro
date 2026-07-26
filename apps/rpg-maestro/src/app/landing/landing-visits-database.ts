import { LandingVisitsDailyCount } from '@rpg-maestro/rpg-maestro-api-contract';

export interface LandingVisitsDatabase {
  incrementDailyCount(date: string, source: string): Promise<void>;

  getAll(): Promise<LandingVisitsDailyCount[]>;
}

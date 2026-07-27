import { LandingEventsDailyCount, LandingEventType } from '@rpg-maestro/rpg-maestro-api-contract';

export interface LandingEventsDatabase {
  incrementDailyCount(date: string, type: LandingEventType, source: string): Promise<void>;

  getAll(): Promise<LandingEventsDailyCount[]>;
}

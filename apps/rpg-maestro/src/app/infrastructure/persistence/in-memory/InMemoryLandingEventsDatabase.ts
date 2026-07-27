import { LandingEventsDailyCount, LandingEventType } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { LandingEventsDatabase } from '../../../landing/landing-events-database';

@Injectable()
export class InMemoryLandingEventsDatabase implements LandingEventsDatabase {
  private dailyCounts: Map<string, LandingEventsDailyCount> = new Map();

  async incrementDailyCount(date: string, type: LandingEventType, source: string): Promise<void> {
    const key = `${date}_${type}_${source}`;
    const existing = this.dailyCounts.get(key);
    this.dailyCounts.set(key, { date, type, source, count: (existing?.count ?? 0) + 1 });
  }

  async getAll(): Promise<LandingEventsDailyCount[]> {
    return Array.from(this.dailyCounts.values()).map((c) => ({ ...c }));
  }
}

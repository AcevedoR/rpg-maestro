import { LandingVisitsDailyCount } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { LandingVisitsDatabase } from '../../../landing/landing-visits-database';

@Injectable()
export class InMemoryLandingVisitsDatabase implements LandingVisitsDatabase {
  private dailyCounts: Map<string, LandingVisitsDailyCount> = new Map();

  async incrementDailyCount(date: string, source: string): Promise<void> {
    const key = `${date}_${source}`;
    const existing = this.dailyCounts.get(key);
    this.dailyCounts.set(key, { date, source, count: (existing?.count ?? 0) + 1 });
  }

  async getAll(): Promise<LandingVisitsDailyCount[]> {
    return Array.from(this.dailyCounts.values()).map((c) => ({ ...c }));
  }
}

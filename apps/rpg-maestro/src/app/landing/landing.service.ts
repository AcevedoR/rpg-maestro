import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateLandingEventRequest,
  CreateLandingVisitRequest,
  CreateUpgradeInterestRequest,
  LandingEventsDailyCount,
  LandingVisitsDailyCount,
  UpgradeInterest,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { UpgradeInterestDatabase } from './upgrade-interest-database';
import { LandingEventsDatabase } from './landing-events-database';
import { LandingVisitsDatabase } from './landing-visits-database';

export const DIRECT_VISIT_SOURCE = 'direct';

@Injectable()
export class LandingService {
  private readonly upgradeInterestDatabase: UpgradeInterestDatabase;
  private readonly landingEventsDatabase: LandingEventsDatabase;
  private readonly landingVisitsDatabase: LandingVisitsDatabase;

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.upgradeInterestDatabase = databaseWrapper.getUpgradeInterestDB();
    this.landingEventsDatabase = databaseWrapper.getLandingEventsDB();
    this.landingVisitsDatabase = databaseWrapper.getLandingVisitsDB();
  }

  async createUpgradeInterest(request: CreateUpgradeInterestRequest): Promise<void> {
    if (request.website) {
      // honeypot filled: pretend success, store nothing
      Logger.warn('upgrade-interest honeypot triggered, ignoring submission');
      return;
    }
    const email = request.email.trim().toLowerCase();
    const existing = await this.upgradeInterestDatabase.get(email);
    if (existing) {
      return;
    }
    await this.upgradeInterestDatabase.upsert({
      email,
      created_at: new Date().toISOString(),
      had_session: request.had_session ?? false,
      source: request.source,
      referrer: request.referrer,
    });
  }

  async getAllUpgradeInterests(): Promise<UpgradeInterest[]> {
    return this.upgradeInterestDatabase.getAll();
  }

  async recordLandingEvent(request: CreateLandingEventRequest): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    const source = request.source?.trim() || DIRECT_VISIT_SOURCE;
    await this.landingEventsDatabase.incrementDailyCount(date, request.type, source);
  }

  async getAllLandingEvents(): Promise<LandingEventsDailyCount[]> {
    return this.landingEventsDatabase.getAll();
  }

  async recordLandingVisit(request: CreateLandingVisitRequest): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    const source = request.source?.trim() || DIRECT_VISIT_SOURCE;
    await this.landingVisitsDatabase.incrementDailyCount(date, source);
  }

  async getAllLandingVisits(): Promise<LandingVisitsDailyCount[]> {
    return this.landingVisitsDatabase.getAll();
  }
}

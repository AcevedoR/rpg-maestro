import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BetaSignup,
  CreateBetaSignupRequest,
  CreateLandingVisitRequest,
  LandingVisitsDailyCount,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { BetaSignupsDatabase } from './beta-signups-database';
import { LandingVisitsDatabase } from './landing-visits-database';

export const DIRECT_VISIT_SOURCE = 'direct';

@Injectable()
export class LandingService {
  private readonly betaSignupsDatabase: BetaSignupsDatabase;
  private readonly landingVisitsDatabase: LandingVisitsDatabase;

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.betaSignupsDatabase = databaseWrapper.getBetaSignupsDB();
    this.landingVisitsDatabase = databaseWrapper.getLandingVisitsDB();
  }

  async createBetaSignup(request: CreateBetaSignupRequest): Promise<void> {
    if (request.website) {
      // honeypot filled: pretend success, store nothing
      Logger.warn('beta signup honeypot triggered, ignoring submission');
      return;
    }
    const email = request.email.trim().toLowerCase();
    const existing = await this.betaSignupsDatabase.get(email);
    if (existing) {
      return;
    }
    await this.betaSignupsDatabase.upsert({
      email,
      created_at: new Date().toISOString(),
      source: request.source,
      referrer: request.referrer,
    });
  }

  async getAllBetaSignups(): Promise<BetaSignup[]> {
    return this.betaSignupsDatabase.getAll();
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

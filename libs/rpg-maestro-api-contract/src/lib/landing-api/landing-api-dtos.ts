import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUpgradeInterestRequest {
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;

  // whether the clicker had already created a session — a used-it-then-clicked-upgrade
  // person is the most valuable row in this dataset
  @IsOptional()
  @IsBoolean()
  had_session?: boolean;

  // honeypot: hidden on the landing page, only bots fill it
  @IsOptional()
  @IsString()
  website?: string;

  constructor(email: string, source?: string, referrer?: string, had_session?: boolean, website?: string) {
    this.email = email;
    this.source = source;
    this.referrer = referrer;
    this.had_session = had_session;
    this.website = website;
  }
}

export interface UpgradeInterest {
  email: string;
  created_at: string;
  had_session: boolean;
  source?: string;
  referrer?: string;
}

export const LandingEventTypes = ['start_free_clicked', 'session_created'] as const;
export type LandingEventType = (typeof LandingEventTypes)[number];

export class CreateLandingEventRequest {
  @IsIn(LandingEventTypes)
  type: LandingEventType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;

  constructor(type: LandingEventType, source?: string, referrer?: string) {
    this.type = type;
    this.source = source;
    this.referrer = referrer;
  }
}

export interface LandingEventsDailyCount {
  date: string;
  type: LandingEventType;
  source: string;
  count: number;
}

export class CreateLandingVisitRequest {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;

  constructor(source?: string, referrer?: string) {
    this.source = source;
    this.referrer = referrer;
  }
}

export interface LandingVisitsDailyCount {
  date: string;
  source: string;
  count: number;
}

import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBetaSignupRequest {
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

  // honeypot: hidden on the landing page, only bots fill it
  @IsOptional()
  @IsString()
  website?: string;

  constructor(email: string, source?: string, referrer?: string, website?: string) {
    this.email = email;
    this.source = source;
    this.referrer = referrer;
    this.website = website;
  }
}

export interface BetaSignup {
  email: string;
  created_at: string;
  source?: string;
  referrer?: string;
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

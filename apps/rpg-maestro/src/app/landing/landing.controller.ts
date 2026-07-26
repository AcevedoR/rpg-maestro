import { BadRequestException, Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  BetaSignup,
  CreateBetaSignupRequest,
  CreateLandingVisitRequest,
  LandingVisitsDailyCount,
  parseAndValidateDto,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { Role } from '../auth/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LandingService } from './landing.service';

@ApiTags('landing')
@Controller()
export class LandingController {
  constructor(@Inject(LandingService) private readonly landingService: LandingService) {}

  @Post('/beta-signups')
  @ApiOperation({ summary: 'Public: register an email for the beta waitlist' })
  async createBetaSignup(@Body() createBetaSignupRequest: CreateBetaSignupRequest): Promise<void> {
    const validatedRequest = await parseAndValidateDto(CreateBetaSignupRequest, createBetaSignupRequest).catch(
      (validationErrors) => {
        throw new BadRequestException(validationErrors);
      }
    );
    await this.landingService.createBetaSignup(validatedRequest);
  }

  @Get('/beta-signups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all beta signups' })
  async getAllBetaSignups(): Promise<BetaSignup[]> {
    return this.landingService.getAllBetaSignups();
  }

  @Post('/landing-visits')
  @ApiOperation({ summary: 'Public: anonymous landing page visit beacon' })
  async recordLandingVisit(@Body() createLandingVisitRequest: CreateLandingVisitRequest): Promise<void> {
    const validatedRequest = await parseAndValidateDto(CreateLandingVisitRequest, createLandingVisitRequest).catch(
      (validationErrors) => {
        throw new BadRequestException(validationErrors);
      }
    );
    await this.landingService.recordLandingVisit(validatedRequest);
  }

  @Get('/landing-visits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list landing page visit daily counts per source' })
  async getAllLandingVisits(): Promise<LandingVisitsDailyCount[]> {
    return this.landingService.getAllLandingVisits();
  }
}

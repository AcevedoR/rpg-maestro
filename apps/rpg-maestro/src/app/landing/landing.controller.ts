import { BadRequestException, Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateLandingEventRequest,
  CreateLandingVisitRequest,
  CreateUpgradeInterestRequest,
  LandingEventsDailyCount,
  LandingVisitsDailyCount,
  parseAndValidateDto,
  UpgradeInterest,
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

  @Post('/upgrade-interest')
  @ApiOperation({ summary: 'Public: register an email as interested in the paid Maestro tier' })
  async createUpgradeInterest(@Body() createUpgradeInterestRequest: CreateUpgradeInterestRequest): Promise<void> {
    const validatedRequest = await parseAndValidateDto(CreateUpgradeInterestRequest, createUpgradeInterestRequest).catch(
      (validationErrors) => {
        throw new BadRequestException(validationErrors);
      }
    );
    await this.landingService.createUpgradeInterest(validatedRequest);
  }

  @Get('/upgrade-interest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all upgrade-interest signups' })
  async getAllUpgradeInterests(): Promise<UpgradeInterest[]> {
    return this.landingService.getAllUpgradeInterests();
  }

  @Post('/landing-events')
  @ApiOperation({ summary: 'Public: anonymous landing funnel event beacon (start_free_clicked, session_created)' })
  async recordLandingEvent(@Body() createLandingEventRequest: CreateLandingEventRequest): Promise<void> {
    const validatedRequest = await parseAndValidateDto(CreateLandingEventRequest, createLandingEventRequest).catch(
      (validationErrors) => {
        throw new BadRequestException(validationErrors);
      }
    );
    await this.landingService.recordLandingEvent(validatedRequest);
  }

  @Get('/landing-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list landing funnel event daily counts per type and source' })
  async getAllLandingEvents(): Promise<LandingEventsDailyCount[]> {
    return this.landingService.getAllLandingEvents();
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

import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { AppVersion } from '@rpg-maestro/rpg-maestro-api-contract';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private health: HealthCheckService,
    @Inject(HttpHealthIndicator) private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  @Get('version')
  version(): AppVersion {
    return {
      version: process.env['APP_VERSION'] ?? null,
      buildDate: process.env['BUILD_DATE'] ?? null,
    };
  }
}
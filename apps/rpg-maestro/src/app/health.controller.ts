import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, HealthIndicatorResult } from '@nestjs/terminus';
import { AppVersion } from '@rpg-maestro/rpg-maestro-api-contract';
import { ServerClock } from './infrastructure/clock/server-clock';
import { SessionStreamsRegistry } from './sessions/session-streams.registry';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private health: HealthCheckService,
    @Inject(HttpHealthIndicator) private http: HttpHealthIndicator,
    @Inject(ServerClock) private serverClock: ServerClock,
    @Inject(SessionStreamsRegistry) private streams: SessionStreamsRegistry
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.playback()]);
  }

  /**
   * Diagnostics for the two things that make playback sound wrong without anything reporting a failure:
   * this instance's clock drifting from the shared reference, and how many streams it is holding.
   *
   * Deliberately always `up`. A skewed clock or a busy instance is something to go look at, not a
   * reason to pull a pod that is otherwise serving music out of rotation.
   */
  private async playback(): Promise<HealthIndicatorResult> {
    return {
      playback: {
        status: 'up',
        clockReference: this.serverClock.getReferenceName() ?? 'local',
        clockOffsetMs: this.serverClock.getOffsetMs(),
        openStreams: this.streams.openCount,
      },
    };
  }

  @Get('version')
  version(): AppVersion {
    return {
      version: process.env['APP_VERSION'] ?? null,
      buildDate: process.env['BUILD_DATE'] ?? null,
    };
  }
}

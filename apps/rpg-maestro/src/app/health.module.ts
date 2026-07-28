import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SessionModule } from './sessions/sessions.module';

@Module({
  imports: [TerminusModule, SessionModule],
  controllers: [HealthController],
})
export class HealthModule {}
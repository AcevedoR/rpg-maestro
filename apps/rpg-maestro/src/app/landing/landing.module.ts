import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { UsersManagementModule } from '../users-management/users-management.module';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [DatabaseModule, UsersManagementModule],
  controllers: [LandingController],
  providers: [LandingService],
})
export class LandingModule {}

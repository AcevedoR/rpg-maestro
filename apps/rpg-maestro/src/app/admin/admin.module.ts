import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { AdminController } from './admin.controller';
import { SessionModule } from '../sessions/sessions.module';
import { UsersManagementModule } from '../users-management/users-management.module';

@Module({
  imports: [DatabaseModule, SessionModule, UsersManagementModule],
  controllers: [AdminController],
})
export class AdminModule {}

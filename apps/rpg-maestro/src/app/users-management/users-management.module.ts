import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from '../infrastructure/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersManagementModule {}

import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { DatabaseModule } from '../infrastructure/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserManagementModule {}

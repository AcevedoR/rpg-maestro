import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from '../infrastructure/database.module';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersManagementModule {}

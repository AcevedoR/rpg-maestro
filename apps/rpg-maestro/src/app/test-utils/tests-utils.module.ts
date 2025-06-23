import { Module } from '@nestjs/common';
import { TestsUtilsController } from './tests-utils.controller';
import { DatabaseModule } from '../infrastructure/database.module';

@Module({
  controllers: [TestsUtilsController],
  imports: [DatabaseModule],
})
export class TestsUtilsModule {}


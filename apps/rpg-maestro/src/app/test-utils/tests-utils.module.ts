import { Module } from '@nestjs/common';
import { TestsUtilsController } from './tests-utils.controller';
import { DatabaseModule } from '../infrastructure/database.module';
import { MaestroApiModule } from '../maestro-api/maestro-api.module';

@Module({
  controllers: [TestsUtilsController],
  imports: [DatabaseModule, MaestroApiModule],
})
export class TestsUtilsModule {}


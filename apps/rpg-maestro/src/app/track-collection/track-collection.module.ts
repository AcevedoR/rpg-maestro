import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { TrackCollectionService } from './track-collection.service';
import { TrackCollectionController } from './track-collection.controller';
import { MaestroApiModule } from '../maestro-api/maestro-api.module';
import { UsersManagementModule } from '../users-management/users-management.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => MaestroApiModule), UsersManagementModule],
  controllers: [TrackCollectionController],
  providers: [TrackCollectionService],
  exports: [TrackCollectionService],
})
export class TrackCollectionModule {}

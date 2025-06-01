import { Module } from '@nestjs/common';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { TrackCreationFromYoutubeJobsStore } from '../maestro-api/TrackCreationFromYoutubeJobsStore';
import {
  InMemoryTrackCreationFromYoutubeJobsStore
} from './persistence/in-memory/InMemoryTrackCreationFromYoutubeJobsStore.service';

@Module({
  providers: [
    DatabaseWrapperConfiguration,
    {
      provide: 'DatabaseWrapperConfiguration_DEFAULT_DATABASE_IMPL',
      useValue: process.env.DATABASE
    },
    {
      provide: TrackCreationFromYoutubeJobsStore,
      useClass: InMemoryTrackCreationFromYoutubeJobsStore,
    },
  ],
  exports: [
    DatabaseWrapperConfiguration,
    {
      provide: TrackCreationFromYoutubeJobsStore,
      useClass: InMemoryTrackCreationFromYoutubeJobsStore,
    },
  ],
})
export class DatabaseModule {}

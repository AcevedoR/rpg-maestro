import { Module } from '@nestjs/common';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { TrackCreationFromYoutubeJobsStore } from '../maestro-api/TrackCreationFromYoutubeJobsStore';
import { InMemoryTrackCreationFromYoutubeJobsStore } from './in-memory-create-track-from-youtube-jobs-database.service';

@Module({
  providers: [
    DatabaseWrapperConfiguration,
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

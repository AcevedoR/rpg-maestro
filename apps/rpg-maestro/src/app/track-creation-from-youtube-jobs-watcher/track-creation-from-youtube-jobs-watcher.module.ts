import { forwardRef, Module } from '@nestjs/common';
import { AudioFileUploaderClient } from './audio-file-uploader-client';
import { AudioFileUploaderHttpClient } from '../infrastructure/audio-file-uploader-client/AudioFileUploaderHttpClient';
import { DatabaseModule } from '../infrastructure/database.module';
import { MaestroApiModule } from '../maestro-api/maestro-api.module';
import { TrackCreationFromYoutubeJobsWatcher } from './track-creation-from-youtube-jobs-watcher.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => MaestroApiModule)],
  providers: [
    {
      provide: AudioFileUploaderClient,
      useClass: AudioFileUploaderHttpClient,
    },
    TrackCreationFromYoutubeJobsWatcher,
  ],
  exports: [
    TrackCreationFromYoutubeJobsWatcher,
    {
      provide: AudioFileUploaderClient,
      useClass: AudioFileUploaderHttpClient,
    },
  ],
})
export class TrackCreationFromYoutubeJobsWatcherModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TrackService } from './TrackService';
import { TrackCreationFromYoutubeJobsWatcherModule } from '../track-creation-from-youtube-jobs-watcher/track-creation-from-youtube-jobs-watcher.module';
import { DatabaseModule } from '../infrastructure/database.module';
import { OnboardingService } from './onboarding.service';
import { UsersService } from './user.service';

@Module({
  imports: [forwardRef(() => TrackCreationFromYoutubeJobsWatcherModule), DatabaseModule],
  providers: [TrackService, OnboardingService, UsersService],
  exports: [TrackService, OnboardingService, UsersService],
})
export class MaestroApiModule {}

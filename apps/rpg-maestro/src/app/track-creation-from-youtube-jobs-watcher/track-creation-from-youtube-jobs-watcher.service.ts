import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  TrackCreationFromYoutubeJob,
  TrackCreationFromYoutubeJobsStore
} from '../maestro-api/TrackCreationFromYoutubeJobsStore';
import { UploadAudioFromYoutubeJobDto } from '@rpg-maestro/audio-file-uploader-api-contract';
import { AudioFileUploaderClient } from './audio-file-uploader-client';
import { TrackService } from '../maestro-api/TrackService';

/**
 * Background job that pulls audio-file-uploader API, watches for changes and updates the TrackCreationFromYoutubeJobsStore
 */
@Injectable()
export class TrackCreationFromYoutubeJobsWatcher {
  private isRunning = false;
  private startedDate: Date | undefined;

  public SYNC_LOOP_INTERVAL_IN_MS = 5000;

  private readonly trackCreationFromYoutubeJobsStore: TrackCreationFromYoutubeJobsStore;
  private readonly audioFileUploaderClient: AudioFileUploaderClient;
  private readonly trackService: TrackService;

  constructor(
    @Inject(TrackCreationFromYoutubeJobsStore)
    trackCreationFromYoutubeJobsStore: TrackCreationFromYoutubeJobsStore,
    @Inject(AudioFileUploaderClient) audioFileUploaderClient: AudioFileUploaderClient,
    @Inject(forwardRef(() => TrackService)) trackService: TrackService
  ) {
    this.trackCreationFromYoutubeJobsStore = trackCreationFromYoutubeJobsStore;
    this.audioFileUploaderClient = audioFileUploaderClient;
    this.trackService = trackService;
  }

  public wakeUp() {
    if (this.isRunning) {
      Logger.debug('TrackCreationFromYoutubeJobsWatcher is already running, no need to wake it up');
      return;
    } else {
      this.startedDate = new Date();
      Logger.debug('TrackCreationFromYoutubeJobsWatcher is starting to work');
      this.synchronizeRunningJobsStateFromAudioFileUploaderApplication();
    }
  }

  /**
   * @return the jobs it updated
   */
  async synchronizeRunningJobsStateFromAudioFileUploaderApplication(): Promise<TrackCreationFromYoutubeJob[]> {
    Logger.debug('TrackCreationFromYoutubeJobsWatcher working');
    this.isRunning = true;
    this.startedDate = new Date();

    const trackCreationJobs = await this.trackCreationFromYoutubeJobsStore.getAll();
    if (!trackCreationJobs || trackCreationJobs.length === 0) {
      Logger.debug('no trackCreationJobs, nothing to do, stopping');
      return Promise.resolve([]);
    } else {
      Logger.debug(`${trackCreationJobs.length} trackCreationJobs to watch for`);
      let uploadJobFromExternalApp: UploadAudioFromYoutubeJobDto[];
      try {
        uploadJobFromExternalApp = await this.audioFileUploaderClient.getCurrentUploads();
      } catch (err) {
        Logger.error(`an error occured while retreiving audioFileUploaderClient.getCurrentUploads(), err: ${err}`);
        this.isRunning = false;
        this.continueSynchronizingIfNecessary(trackCreationJobs);
        return Promise.resolve([]);
      }
      const updatedJobs: TrackCreationFromYoutubeJob[] = [];

      for (const trackCreationJob of trackCreationJobs) {
        for (const uploadJob of uploadJobFromExternalApp) {
          if (
            uploadJob.youtubeURL === trackCreationJob.youtubeUrlToUpload && // TODO improve this, this is weak, better pass a rpg-maestro-request-uuid at upload and condition on it
            uploadJob.updatedDate >= trackCreationJob.updatedDate.getTime()
          ) {
            if (uploadJob.status === 'success') {
              trackCreationJob.uploaded(uploadJob.uploadedFile, uploadJob.uploadedFileLink);
              updatedJobs.push(trackCreationJob);
              await this.trackService
                .createTrack(trackCreationJob.sessionId, {
                  url: trackCreationJob.uploadedFileLink,
                  originMedia: 'youtube',
                  originUrl: trackCreationJob.youtubeUrlToUpload,
                })
                .then((createdTrack) => {
                  Logger.log(
                    `track created from youtube, session: ${createdTrack.sessionId}, trackName: ${createdTrack.name}`
                  );
                  trackCreationJob.succedeed(createdTrack.id, createdTrack.name);
                  updatedJobs.push(trackCreationJob);
                })
                .catch((err) => {
                  Logger.error(
                    `fail to create track from youtube, session: ${trackCreationJob.sessionId}, ytUrl: ${trackCreationJob.youtubeUrlToUpload}, err: ${err}`
                  );
                  trackCreationJob.failed(err);
                  updatedJobs.push(trackCreationJob);
                });
            } else if (uploadJob.status === 'failed') {
              Logger.error(
                `fail to upload track from youtube, session: ${trackCreationJob.sessionId}, ytUrl: ${trackCreationJob.youtubeUrlToUpload}, err: ${uploadJob.error}`
              );
              trackCreationJob.failed(uploadJob.error);
              updatedJobs.push(trackCreationJob);
            } else if (uploadJob.status === 'running') {
              trackCreationJob.uploadRequested();
              updatedJobs.push(trackCreationJob);
            } else {
              throw new Error(`unhandled case: ${uploadJob.status}`);
            }
          }
        }
      }

      this.isRunning = false;
      await this.continueSynchronizingIfNecessary(trackCreationJobs);
      return updatedJobs;
    }
  }

  continueSynchronizingIfNecessary(trackCreationJobs: TrackCreationFromYoutubeJob[]): Promise<void> {
    const isThereAnyMoreJobsNeedingSync = trackCreationJobs.some((job) => !['success', 'failed'].includes(job.status));
    if (isThereAnyMoreJobsNeedingSync) {
      Logger.debug(`more synchronizing is required, trigger another wakeUp() in ${this.SYNC_LOOP_INTERVAL_IN_MS}ms`);
      setTimeout(() => {
        Logger.debug('timeout launched');
        this.wakeUp();
      }, this.SYNC_LOOP_INTERVAL_IN_MS);
      return;
    }
    return;
  }
}

async function sleep(delay): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(() => {
      console.error('This message is logged after 2 seconds');
      resolve();
    }, delay);
  });
}

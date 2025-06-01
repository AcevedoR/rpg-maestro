import { InMemoryTrackCreationFromYoutubeJobsStore } from '../infrastructure/in-memory-create-track-from-youtube-jobs-database.service';
import { TrackCreationFromYoutubeJob } from '../maestro-api/TrackCreationFromYoutubeJobsStore';
import { randomUUID } from 'node:crypto';
import { AudioFileUploaderClient } from './audio-file-uploader-client';
import {
  UploadAudioFromYoutubeJobDto,
  UploadAudioFromYoutubeRequest,
} from '@rpg-maestro/audio-file-uploader-api-contract';
import { TrackCreationFromYoutubeJobsWatcher } from './track-creation-from-youtube-jobs-watcher.service';
import { Track, TrackCreation } from '@rpg-maestro/rpg-maestro-api-contract';
import { TrackService } from '../maestro-api/TrackService';

let backgroundUploader: TrackCreationFromYoutubeJobsWatcher;
let db: InMemoryTrackCreationFromYoutubeJobsStore;
let audioFileUploaderClientFake: AudioFileUploaderClientFake;

beforeEach(() => {
  db = new InMemoryTrackCreationFromYoutubeJobsStore();
  audioFileUploaderClientFake = new AudioFileUploaderClientFake();
  backgroundUploader = new TrackCreationFromYoutubeJobsWatcher(
    db,
    audioFileUploaderClientFake,
    new TrackServicePartialFake() as TrackService
  );
});

function generateAudioFileUploaderJob(status: 'running' | 'failed' | 'success', url: string) {
  return new UploadAudioFromYoutubeJobDto(
    url,
    status,
    Date.now(),
    Date.now(),
    'an upload error occured',
    randomStr(),
    randomStr()
  );
}

describe('backgroundUploader tests', () => {
  it('should not do anything when there is nothing to be done', async () => {
    const res = await backgroundUploader.synchronizeRunningJobsStateFromAudioFileUploaderApplication();
    expect(res).toHaveLength(0);
    const dbJobs = await db.getAll();
    expect(dbJobs).toHaveLength(0);
  });

  it('should not do anything when nothing has changed', async () => {
    await db.set(randomStr(), generateJob(randomStr(), randomStr()));

    const res = await backgroundUploader.synchronizeRunningJobsStateFromAudioFileUploaderApplication();
    expect(res).toHaveLength(0);
    const dbJobs = await db.getAll();
    expect(dbJobs).toHaveLength(1);
    expect(dbJobs[0]).toHaveProperty('status', 'running');
  });

  it('should update when an upload is failed', async () => {
    await db.set(randomStr(), generateJob(randomStr(), 'my-URL'));
    audioFileUploaderClientFake.state = [generateAudioFileUploaderJob('failed', 'my-URL')];

    const res = await backgroundUploader.synchronizeRunningJobsStateFromAudioFileUploaderApplication();
    expect(res).toHaveLength(1);
    const dbJobs = await db.getAll();
    expect(dbJobs[0]).toHaveProperty('status', 'failed');
    expect(dbJobs[0]).toHaveProperty('youtubeUrlToUpload', 'my-URL');
  });
});

function generateJob(sessionId: string, url: string): TrackCreationFromYoutubeJob {
  return new TrackCreationFromYoutubeJob(sessionId, url);
}

function randomStr(): string {
  return randomUUID();
}

class AudioFileUploaderClientFake implements AudioFileUploaderClient {
  state: UploadAudioFromYoutubeJobDto[] = [];

  uploadAudioFromYoutube(_request: UploadAudioFromYoutubeRequest): Promise<void> {
    return;
  }

  getCurrentUploads(): Promise<UploadAudioFromYoutubeJobDto[]> {
    return Promise.resolve(this.state);
  }
}

class TrackServicePartialFake {
  async createTrack(_sessionId: string, _trackCreation: TrackCreation): Promise<Track> {
    return Promise.resolve(<Track>{
      id: '1',
      url: 'someurl',
      created_at: 1,
      updated_at: 1,
      sessionId: 'session1',
      name: 'name1',
      duration: 2,
      tags: [],
      source: {
        origin_url: 'originurl',
        origin_media: 'originmedia',
        origin_name: 'originname',
      },
    });
  }
}

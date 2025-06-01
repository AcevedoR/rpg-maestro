import {
  TrackCreationFromYoutubeJob,
  TrackCreationFromYoutubeJobsStore,
} from '../maestro-api/TrackCreationFromYoutubeJobsStore';
import { Injectable } from '@nestjs/common';

// TODO fix this hack forbidding having more than one instance
@Injectable()
export class InMemoryTrackCreationFromYoutubeJobsStore implements TrackCreationFromYoutubeJobsStore {
  readonly db = new Map<string, TrackCreationFromYoutubeJob>();

  set(key: string, runningJob: TrackCreationFromYoutubeJob) {
    this.db.set(key, runningJob);
    return Promise.resolve();
  }

  get(key: string) {
    this.cleanupOldDataIfNecessary();
    return Promise.resolve(this.db.get(key));
  }

  getAll() {
    return Promise.resolve([...this.db.values()]);
  }

  getAllForSession(sessionId: string | null) {
    this.cleanupOldDataIfNecessary();
    const res: TrackCreationFromYoutubeJob[] = [];
    for (const [_key, val] of this.db) {
      if (val.sessionId === sessionId) {
        res.push(val);
      }
    }
    return Promise.resolve(res);
  }

  cleanupOldDataIfNecessary() {
    for (const [key, val] of this.db) {
      if (val.isExpired()) {
        this.db.delete(key);
      }
    }
  }
}

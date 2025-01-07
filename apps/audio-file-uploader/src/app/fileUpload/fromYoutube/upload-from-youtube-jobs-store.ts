import { Injectable } from '@nestjs/common';
import { UploadFromYoutubeJob } from './UploadFromYoutubeJob';

@Injectable()
export class UploadFromYoutubeJobsStore {
  readonly db = new Map<string, UploadFromYoutubeJob>();

  set(key: string, runningJob: UploadFromYoutubeJob) {
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

  cleanupOldDataIfNecessary() {
    for (const [key, val] of this.db) {
      if (val.isExpired()) {
        this.db.delete(key);
      }
    }
  }
}

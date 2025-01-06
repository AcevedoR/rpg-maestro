import { CreateTrackFromYoutubeResponseForUrl } from '@rpg-maestro/rpg-maestro-api-contract';

export const DEFAULT_TTL = 60 * 60 * 1000;

export interface RunningJobsDatabase {
  set: (key: string, runningJob: RunningJob) => Promise<void>;
  get: (key: string) => Promise<RunningJob>;
  getAll: () =>  Promise<RunningJob[]>;
  getAllForSession: (sessionId: string | null) => Promise<RunningJob[]>;
}

export class RunningJob {
  constructor(sessionId: string, status: 'running' | 'failed' | 'success', error: string | null, job: BackgroundJob) {
    this.sessionId = sessionId;
    this.status = status;
    this.error = error;
    this.job = job;
    this.ttl_in_ms = DEFAULT_TTL;
    this.createdDate = new Date();
    this.updatedDate = new Date(this.createdDate);
  }

  sessionId: string | null;
  status: 'running' | 'failed' | 'success';
  error?: string;
  job: BackgroundJob;
  createdDate: Date;
  updatedDate: Date;
  ttl_in_ms: number;

  isExpired() {
    return Date.now() > this.updatedDate.getTime() + this.ttl_in_ms;
  }
}

export interface BackgroundJob {
  _type: string;
}

export interface UploadYoutubeURLJob extends BackgroundJob {
  _type: 'UploadYoutubeURLJob';
  sessionId: string;
  youtubeUrlToUpload: string;
  result?: CreateTrackFromYoutubeResponseForUrl;
}

export const RunningJobsDatabase = Symbol('RunningJobsDatabase');

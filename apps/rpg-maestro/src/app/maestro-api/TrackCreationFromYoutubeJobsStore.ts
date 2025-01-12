import { randomUUID } from 'node:crypto';

export const DEFAULT_TTL = 60 * 60 * 1000;

export interface TrackCreationFromYoutubeJobsStore {
  set: (key: string, runningJob: TrackCreationFromYoutubeJob) => Promise<void>;
  get: (key: string) => Promise<TrackCreationFromYoutubeJob>;
  getAll: () => Promise<TrackCreationFromYoutubeJob[]>;
  getAllForSession: (sessionId: string | null) => Promise<TrackCreationFromYoutubeJob[]>;
}

export class TrackCreationFromYoutubeJob {
  constructor(sessionId: string, youtubeUrlToUpload: string) {
    this.id = randomUUID();
    this.sessionId = sessionId;
    this.youtubeUrlToUpload = youtubeUrlToUpload;
    this.status = 'running';
    this.ttl_in_ms = DEFAULT_TTL;
    this.createdDate = new Date();
    this.updatedDate = new Date(this.createdDate);
  }

  id: string;
  sessionId: string;
  status: 'running' | 'uploading' | 'creating' | 'failed' | 'success';
  youtubeUrlToUpload: string;

  error?: string;
  uploadedFile?: string;
  uploadedFileLink?: string;
  trackName?: string;
  trackId?: string;

  createdDate: Date;
  updatedDate: Date;
  ttl_in_ms: number;

  uploadRequested() {
    if (!['running'].includes(this.status)) {
      throw new Error(`cannot mark a job as uploading a job when it was already: ${this.status}`);
    }
    this.updatedDate = new Date();
    this.status = 'uploading';
  }

  uploaded(uploadedFile: string, uploadedFileLink: string) {
    if (!['uploading'].includes(this.status)) {
      throw new Error(`cannot mark a job as uploaded a job when it was already: ${this.status}`);
    }
    this.updatedDate = new Date();
    this.status = 'creating';
    this.uploadedFile = uploadedFile;
    this.uploadedFileLink = uploadedFileLink;
  }

  succedeed(trackId: string, trackName: string) {
    if (!['running', 'uploading', 'creating'].includes(this.status)) {
      throw new Error(`cannot mark a job as success when it was already: ${this.status}`);
    }
    this.updatedDate = new Date();
    this.status = 'success';
    this.trackId = trackId;
    this.trackName = trackName;
  }

  failed(error: string) {
    if (!['running', 'uploading', 'creating'].includes(this.status)) {
      throw new Error(`cannot mark a job as failed when it was already: ${this.status}`);
    }
    this.updatedDate = new Date();
    this.status = 'failed';
    this.error = error;
  }

  isExpired() {
    return Date.now() > this.updatedDate.getTime() + this.ttl_in_ms;
  }
}

export const TrackCreationFromYoutubeJobsStore = Symbol('TrackCreationFromYoutubeJobsStore');

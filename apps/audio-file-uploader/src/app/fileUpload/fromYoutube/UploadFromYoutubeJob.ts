const DEFAULT_TTL = 60 * 60 * 1000;

export class UploadFromYoutubeJob {
  constructor(youtubeUrlToUpload: string) {
    this.youtubeUrlToUpload = youtubeUrlToUpload;
    this.status = 'running';
    this.ttl_in_ms = DEFAULT_TTL;
    this.createdDate = new Date();
    this.updatedDate = new Date(this.createdDate);
  }

  status: 'running' | 'failed' | 'success';
  youtubeUrlToUpload: string;

  error?: string;
  uploadedFile?: string;
  uploadedFileLink?: string;

  createdDate: Date;
  updatedDate: Date;
  ttl_in_ms: number;

  succedeed(uploadedFile: string, uploadedFileLink: string) {
    if (this.status != 'running') {
      throw new Error(`cannot mark a job as succedeed when it was already: ${this.status}`);
    }
    this.updatedDate = new Date();
    this.status = 'success';
    this.uploadedFile = uploadedFile;
    this.uploadedFileLink = uploadedFileLink;
  }

  failed(error: string) {
    if (this.status != 'running') {
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

export interface GetUploadAudioFromYoutubeResponse {
  jobs: UploadAudioFromYoutubeJob[];
}

export class UploadAudioFromYoutubeJob {
  id: string;
  youtubeURL: string;

  status: 'running' | 'failed' | 'success';
  createdDate: Date;
  updatedDate: Date;

  error?: string;
  uploadedFile?: string;
  uploadedFileLink?: string;

  constructor(id: string, youtubeURL: string, status: "running" | "failed" | "success", createdDate: Date, updatedDate: Date, error: string, uploadedFile: string, uploadedFileLink: string) {
    this.id = id;
    this.youtubeURL = youtubeURL;
    this.status = status;
    this.createdDate = createdDate;
    this.updatedDate = updatedDate;
    this.error = error;
    this.uploadedFile = uploadedFile;
    this.uploadedFileLink = uploadedFileLink;
  }
}

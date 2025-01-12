export class TrackCreationFromYoutubeDto {
  constructor(
    id: string,
    sessionId: string,
    status: 'running' | 'uploading' | 'creating' | 'failed' | 'success',
    youtubeUrlToUpload: string,
    error: string | undefined,
    uploadedFile: string | undefined,
    uploadedFileLink: string | undefined,
    trackName: string | undefined,
    trackId: string | undefined,
    createdDate: Date,
    updatedDate: Date
  ) {
    this.id = id;
    this.sessionId = sessionId;
    this.status = status;
    this.youtubeUrlToUpload = youtubeUrlToUpload;
    this.error = error;
    this.uploadedFile = uploadedFile;
    this.uploadedFileLink = uploadedFileLink;
    this.trackName = trackName;
    this.trackId = trackId;
    this.createdDate = createdDate;
    this.updatedDate = updatedDate;
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
}

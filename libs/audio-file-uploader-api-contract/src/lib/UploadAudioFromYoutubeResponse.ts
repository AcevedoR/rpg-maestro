export class UploadAudioFromYoutubeJobDto {
  youtubeURL: string;

  status: 'running' | 'failed' | 'success';
  createdDate: number;
  updatedDate: number;

  error?: string;
  uploadedFile?: string;
  uploadedFileLink?: string;

  constructor(
    youtubeURL: string,
    status: 'running' | 'failed' | 'success',
    createdDate: number,
    updatedDate: number,
    error: string,
    uploadedFile: string,
    uploadedFileLink: string
  ) {
    this.youtubeURL = youtubeURL;
    this.status = status;
    this.createdDate = createdDate;
    this.updatedDate = updatedDate;
    this.error = error;
    this.uploadedFile = uploadedFile;
    this.uploadedFileLink = uploadedFileLink;
  }
}

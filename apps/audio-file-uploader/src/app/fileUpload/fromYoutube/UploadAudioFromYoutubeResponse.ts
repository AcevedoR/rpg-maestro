export interface UploadAudioFromYoutubeResponse {
  uploadResult: UploadAudioFromYoutubeResponseForUrl[];
}

export interface UploadAudioFromYoutubeResponseForUrl {
  url: string;
  status: string;
  uploadedFile?: string;
  uploadedFileLink?: string;
}

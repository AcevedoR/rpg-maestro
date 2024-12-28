export interface UploadAudioFromYoutubeResponse {
  uploadResult: UploadAudioFromYoutubeResponseForUrl[];
  uploadedFilesLinks: string[]
}

export interface UploadAudioFromYoutubeResponseForUrl {
  url: string;
  status: string;
  uploadedFile?: string;
}

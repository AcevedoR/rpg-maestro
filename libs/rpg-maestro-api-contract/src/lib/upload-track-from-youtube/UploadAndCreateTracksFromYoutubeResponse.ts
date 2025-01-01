export interface UploadAndCreateTracksFromYoutubeResponse {
  createResult: CreateTrackFromYoutubeResponseForUrl[];
}

export interface CreateTrackFromYoutubeResponseForUrl {
  url: string;
  status: string;
  uploadedFile?: string;
  uploadedFileLink?: string;
  trackName?: string;
  trackId?: string;
}

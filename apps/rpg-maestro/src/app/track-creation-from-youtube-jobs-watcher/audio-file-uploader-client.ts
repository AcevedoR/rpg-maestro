import {
  UploadAudioFromYoutubeJobDto,
  UploadAudioFromYoutubeRequest,
} from '@rpg-maestro/audio-file-uploader-api-contract';

export interface AudioFileUploaderClient {
  uploadAudioFromYoutube(request: UploadAudioFromYoutubeRequest): Promise<void>;

  getCurrentUploads(): Promise<UploadAudioFromYoutubeJobDto[]>;
}

export const AudioFileUploaderClient = Symbol('AudioFileUploaderClient');

import {
  UploadAudioFromYoutubeJobDto,
  UploadAudioFromYoutubeRequest,
} from '@rpg-maestro/audio-file-uploader-api-contract';
import { Injectable, Logger } from '@nestjs/common';
import { jsonFetch } from '../utlis/fetch-wrapper';
import { AudioFileUploaderClient } from '../../track-creation-from-youtube-jobs-watcher/audio-file-uploader-client';

export const DEFAULT_AUDIO_FILE_UPLOADER_API_URL = process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL;
Logger.log(`using DEFAULT_AUDIO_FILE_UPLOADER_API_URL=${DEFAULT_AUDIO_FILE_UPLOADER_API_URL}`);

@Injectable()
export class AudioFileUploaderHttpClient implements AudioFileUploaderClient {
  async uploadAudioFromYoutube(request: UploadAudioFromYoutubeRequest): Promise<void> {
    await jsonFetch('POST', `${DEFAULT_AUDIO_FILE_UPLOADER_API_URL}/upload/audio/from-youtube`, request);
  }

  async getCurrentUploads(): Promise<UploadAudioFromYoutubeJobDto[]> {
    return (await jsonFetch(
      'GET',
      `${DEFAULT_AUDIO_FILE_UPLOADER_API_URL}/upload/audio/from-youtube`
    )) as UploadAudioFromYoutubeJobDto[];
  }
}

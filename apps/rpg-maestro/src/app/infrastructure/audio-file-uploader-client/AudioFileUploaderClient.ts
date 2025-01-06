import {
  GetUploadAudioFromYoutubeResponse,
  UploadAudioFromYoutubeRequest
} from '@rpg-maestro/audio-file-uploader-api-contract';
import { Logger } from '@nestjs/common';
import { jsonFetch } from '../utlis/fetch-wrapper';

export const DEFAULT_AUDIO_FILE_UPLOADER_API_URL = process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL;
Logger.log(`using ${DEFAULT_AUDIO_FILE_UPLOADER_API_URL} as DEFAULT_AUDIO_FILE_UPLOADER_API_URL`);


export async function uploadAudioFromYoutube(request: UploadAudioFromYoutubeRequest): Promise<void> {
  await jsonFetch('POST', `${DEFAULT_AUDIO_FILE_UPLOADER_API_URL}/upload/audio/from-youtube`, request);
}

export async function getCurrentUploads(): Promise<GetUploadAudioFromYoutubeResponse> {
  return await jsonFetch('GET', `${DEFAULT_AUDIO_FILE_UPLOADER_API_URL}/upload/audio/from-youtube`) as GetUploadAudioFromYoutubeResponse;
}

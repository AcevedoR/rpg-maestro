import {
  UploadAudioFromYoutubeRequest,
  UploadAudioFromYoutubeResponse,
} from '@rpg-maestro/audio-file-uploader-api-contract';
import { Logger } from '@nestjs/common';

export const DEFAULT_AUDIO_FILE_UPLOADER_API_URL = process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL;
Logger.log(`using ${DEFAULT_AUDIO_FILE_UPLOADER_API_URL} as DEFAULT_AUDIO_FILE_UPLOADER_API_URL`);

export async function uploadAudioFromYoutube(
  request: UploadAudioFromYoutubeRequest
): Promise<UploadAudioFromYoutubeResponse> {
  try {
    const response = await fetch(`${DEFAULT_AUDIO_FILE_UPLOADER_API_URL}/upload/audio/from-youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(60 * 60 * 1000)
    });
    if (response.ok) {
      const res = (await response.json()) as UploadAudioFromYoutubeResponse;
      return res;
    }else {
      const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
      Logger.log(`uploadAudioFromYoutube failed with error: ${shortError}`, response);
      throw new Error(
        `Cannot uploadAudioFromYoutube, fetch error: ${shortError}, full error: ${await response.text()}`
      );
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Logger.error(error);
      if (error.message && error.message === 'fetch failed') {
        throw new Error(`Fetch network error: ${error}`);
      } else {
        throw new Error(`Fetch unhandled error: ${error}`);
      }
    } else {
      throw error;
    }
  }
}

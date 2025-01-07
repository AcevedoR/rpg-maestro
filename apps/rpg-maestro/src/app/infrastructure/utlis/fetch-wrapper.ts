import { UploadAudioFromYoutubeRequest } from '@rpg-maestro/audio-file-uploader-api-contract';
import { HttpStatus, Logger } from '@nestjs/common';

/**
 * @return the data as JS if request was successful, or an error otherwise
 * @param url
 * @param method
 * @param body
 */
export async function jsonFetch(
  method: 'POST' | 'GET' | 'PUT',
  url: string,
  body?: UploadAudioFromYoutubeRequest
): Promise<any> {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    if (body) {
      options['body'] = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (response.ok) {
      if (response.status === HttpStatus.ACCEPTED) {
        return null;
      } else {
        return response.json();
      }
    } else {
      const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
      Logger.log(`${method}: ${url} failed with error: ${shortError}`, response);
      throw new Error(`Cannot ${method}: ${url}, fetch error: ${shortError}, full error: ${await response.text()}`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Logger.error(`${method}: ${url} failed with error:`, error);
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

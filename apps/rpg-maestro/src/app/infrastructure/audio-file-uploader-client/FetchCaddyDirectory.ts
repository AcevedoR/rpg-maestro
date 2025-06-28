import { TrackCreation } from '@rpg-maestro/rpg-maestro-api-contract';
import { Logger } from '@nestjs/common';

interface CaddyFileserverFile {
  name: string;
  size: number;
  url: string;
  mod_time: string;
  mode: number;
  is_dir: boolean;
  is_symlink: boolean;
}

export async function getAllFilesFromCaddyFileServerDirectory(url: string): Promise<TrackCreation[]> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok || response.status != 200) {
      const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
      Logger.error(`getAllFilesFromFileServerDirectory failed with error: ${shortError}`, response);
      throw new Error(
        `Cannot create tracks, url not reachable, fetch error: ${shortError}, full error: ${await response.text()}`
      );
    } else {
      const caddyFiles = await response.json() as CaddyFileserverFile[];
      Logger.log(`found ${caddyFiles.length} tracks to insert from fileserver: ${url}`);
      return caddyFiles
        .filter(x => !x.is_dir)
        .map(x => ({url: `${url}/${x.url}`} as TrackCreation))
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Logger.debug(error);
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

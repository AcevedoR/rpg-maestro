import { v4 as uuid } from 'uuid';
import path from 'path';
import { Database } from './Database';
import { getTrackDuration } from './audio/AudioHelper';
import { PlayingTrack, Track, TrackCreation, TracksFromDirectoryCreation } from '@rpg-maestro/rpg-maestro-api-contract';
import { getAllFilesFromCaddyFileServerDirectory } from '../infrastructure/FetchCaddyDirectory';

export class TrackService {
  database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async createTrack(trackCreation: TrackCreation): Promise<Track> {
    const now = Date.now();

    const url = new URL(trackCreation.url);
    const fileName = getFileName(url);
    await checkFileIfActuallyUsable(trackCreation.url);
    const duration = await getTrackDuration(url);

    const track: Track = {
      id: uuid(),
      created_at: now,
      updated_at: now,

      source: {
        origin_media: 'same-server',
        origin_url: trackCreation.url,
        origin_name: fileName,
      },

      name: fileName,
      url: trackCreation.url,
      duration: duration,
      tags: trackCreation.tags ?? [],
    };

    await this.database.save(track);

    return track;
  }

  async getAll(): Promise<Track[]> {
    return this.database.getAllTracks();
  }

  async get(id: string): Promise<Track> {
    return this.database.getTrack(id);
  }

  async getCurrentlyPlaying(): Promise<PlayingTrack> {
    const s = await this.database.getCurrentSession();
    return s.currentTrack;
  }

  async createAllTracksFromDirectory(tracksFromDirectoryCreation: TracksFromDirectoryCreation): Promise<void> {
    await Promise.all(
      (
        await getAllFilesFromCaddyFileServerDirectory(tracksFromDirectoryCreation.directoryUrl)
      ).map((x) => this.createTrack(x))
    );
  }
}

async function checkFileIfActuallyUsable(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok || response.status != 200) {
      const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
      console.log(`checkFileIfActuallyUsable failed with error: ${shortError}`, response);
      throw new Error(
        `Cannot create track, file not reachable, fetch error: ${shortError}, full error: ${await response.text()}`
      );
    }
  } catch (error) {
    if (error instanceof TypeError) {
      console.debug(error);
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

function getFileName(fileUrl: URL) {
  const fileFullName = fileUrl.pathname;
  const extension = path.extname(fileFullName);
  return path.basename(fileFullName, extension);
}

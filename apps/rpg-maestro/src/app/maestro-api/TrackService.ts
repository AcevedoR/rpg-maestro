import { v4 as uuid } from 'uuid';
import path from 'path';
import { Database } from './Database';
import { getTrackDuration } from './audio/AudioHelper';
import {
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TracksFromDirectoryCreation,
  TrackUpdate,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { getAllFilesFromCaddyFileServerDirectory } from '../infrastructure/FetchCaddyDirectory';

export class TrackService {
  database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async createTrack(sessionId: string, trackCreation: TrackCreation): Promise<Track> {
    const now = Date.now();

    const url = new URL(trackCreation.url);
    const fileName = getFileName(url);
    await checkFileIfActuallyUsable(trackCreation.url);
    const duration = await getTrackDuration(url);

    const track: Track = {
      id: uuid(),
      sessionId: sessionId,
      created_at: now,
      updated_at: now,

      source: {
        origin_media: 'same-server',
        origin_url: trackCreation.url,
        origin_name: fileName,
      },

      name: trackCreation.name ?? fileName,
      url: trackCreation.url,
      duration: duration,
      tags: trackCreation.tags ?? [],
    };

    await this.database.save(track);

    return track;
  }

  async updateTrack(id: string, trackUpdate: TrackUpdate): Promise<Track> {
    const existing = await this.database.getTrack(id);

    existing.name = trackUpdate.name;
    existing.tags = trackUpdate.tags;
    existing.updated_at = Date.now();

    await this.database.save(existing);

    return existing;
  }

  async getAll(sessionId: string): Promise<Track[]> {
    return this.database.getAllTracks(sessionId);
  }

  async get(id: string): Promise<Track> {
    return this.database.getTrack(id);
  }

  async getSessionPlayingTracks(sessionId: string): Promise<SessionPlayingTracks> {
    return this.database.getCurrentSession(sessionId);
  }

  async createAllTracksFromDirectory(
    sessionId: string,
    tracksFromDirectoryCreation: TracksFromDirectoryCreation
  ): Promise<void> {
    await Promise.all(
      (
        await getAllFilesFromCaddyFileServerDirectory(tracksFromDirectoryCreation.directoryUrl)
      ).map((x) => this.createTrack(sessionId, x))
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
  return decodeURI(path.basename(fileFullName, extension));
}

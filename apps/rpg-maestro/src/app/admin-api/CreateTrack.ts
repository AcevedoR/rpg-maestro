import { TrackCreation } from "../model/TrackCreation";
import { Track } from "../model/Track";
import { v4 as uuid } from "uuid";
import path from "path";
import { Database } from '../infrastructure/Database';
import { getTrackDuration } from './audio/AudioHelper';

export class CreateTrack {
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
        origin_media: "same-server",
        origin_url: trackCreation.url,
        origin_name: fileName,
      },

      name: fileName,
      url: trackCreation.url,
      duration: duration,
      tags: trackCreation.tags,
    };

    await this.database.save(track);

    return track;
  }


}

async function checkFileIfActuallyUsable(url: string) {
  const response = await fetch(url);
  if (!response.ok || response.status != 200) {
    const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
    console.log(
      `checkFileIfActuallyUsable failed with error: ${shortError}`,
      response
    );
    throw new Error(
      `Cannot create track, file not reachable, fetch error: ${shortError}, full error: ${await response.text()}`
    );
  }
}

function getFileName(fileUrl: URL) {
  const fileFullName = fileUrl.pathname;
  const extension = path.extname(fileFullName);
  return path.basename(fileFullName, extension);
}
import { Database } from "./Database";
import { PlayingTrack } from "../model/PlayingTrack";

export interface TrackToPlay {
  trackId: string;

  startTime?: number;
  paused?: boolean;
}

export class ManageCurrentlyPlayingTracks {
  database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async changeCurrentTrack(trackToPlay: TrackToPlay) {
    const track = await this.database.getTrack(trackToPlay.trackId);
    await this.database.upsertCurrentTrack(
      new PlayingTrack(
        track.id,
        track.name,
        track.duration,
        false,
        Date.now(),
        0
      )
    );
    return Promise.resolve();
  }
}

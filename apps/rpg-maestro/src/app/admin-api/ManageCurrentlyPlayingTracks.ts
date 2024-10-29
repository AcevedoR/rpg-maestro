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
    if(!trackToPlay || !trackToPlay.trackId){
      throw new Error("when changeCurrentTrack, trackId is required");
    }

    const track = await this.database.getTrack(trackToPlay.trackId);
    await this.database.upsertCurrentTrack(
      new PlayingTrack(
        track.id,
        track.name,
        track.url,
        track.duration,
        false,
        Date.now(),
        0
      )
    );
    return Promise.resolve();
  }
}

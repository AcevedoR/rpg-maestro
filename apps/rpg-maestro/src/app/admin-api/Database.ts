import { Track } from "../model/Track";
import { Session } from "../model/Session";
import { PlayingTrack } from "../model/PlayingTrack";

export interface Database {
  save: (track: Track) => Promise<void>;
  getCurrentSession: () => Promise<Session>;
  upsertCurrentTrack: (playingTrack: PlayingTrack) => Promise<void>;

  getTrack(trackId: string): Promise<Track>;

  getAllTracks(): Promise<Track[]>;
}

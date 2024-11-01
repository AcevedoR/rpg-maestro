import { Session } from "../model/Session";
import { PlayingTrack, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export interface Database {
  save: (track: Track) => Promise<void>;
  getCurrentSession: () => Promise<Session>;
  upsertCurrentTrack: (playingTrack: PlayingTrack) => Promise<void>;

  getTrack(trackId: string): Promise<Track>;

  getAllTracks(): Promise<Track[]>;
}

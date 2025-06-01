import { PlayingTrack, SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export interface TracksDatabase {
  save: (track: Track) => Promise<void>;
  getCurrentSession: (sessionId: string) => Promise<SessionPlayingTracks>;
  upsertCurrentTrack: (sessionId: string, playingTrack: PlayingTrack) => Promise<void>;

  getTrack(trackId: string): Promise<Track>;

  getAllTracks(sessionId: string): Promise<Track[]>;
}

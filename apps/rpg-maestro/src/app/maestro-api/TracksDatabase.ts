import { PlayingTrack, SessionID, SessionPlayingTracks, Track, UserID } from '@rpg-maestro/rpg-maestro-api-contract';

export interface TracksDatabase {
  getSession: (sessionId: string) => Promise<SessionPlayingTracks>;

  createSession(sessionId: SessionID): Promise<void>;

  save: (track: Track) => Promise<void>;
  upsertCurrentTrack: (sessionId: string, playingTrack: PlayingTrack) => Promise<void>;

  getTrack(trackId: string): Promise<Track>;

  getAllTracks(sessionId: string): Promise<Track[]>;
}

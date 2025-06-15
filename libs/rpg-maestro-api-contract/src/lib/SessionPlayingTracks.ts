import { PlayingTrack } from './PlayingTrack';

export interface SessionPlayingTracks {
  sessionId: SessionID;
  currentTrack: PlayingTrack | null;
}

export type SessionID = string;

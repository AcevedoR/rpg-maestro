import { PlayingTrack } from './PlayingTrack';
import { IsString, IsOptional, IsArray } from 'class-validator';

// TODO make this a real session, with create and update date
export interface SessionPlayingTracks {
  sessionId: SessionID;
  currentTrack: PlayingTrack | null;
}

export type SessionID = string;

export class CreateSession {

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  withTrackCollections?: string[];
}
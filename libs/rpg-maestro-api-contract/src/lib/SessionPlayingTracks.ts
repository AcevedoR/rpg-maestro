import { PlayingTrack } from './PlayingTrack';
import { IsString, IsOptional, IsArray } from 'class-validator';

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
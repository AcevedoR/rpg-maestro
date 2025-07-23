import { UserID } from './User';
import { TrackSource } from './TrackSource';

export interface TrackCollection {
  id: string;
  name: string;
  description: string | null;
  tracks: CollectionTrack[];
  created_at: number;
  updated_at: number;
  created_by: UserID;
}

export interface CollectionTrack {
  id: string;
  source: TrackSource;

  name: string;
  tags: string[];
  url: string;
  duration: number;
}

export interface CollectionTrackCreation {
  source: TrackSource;
  name: string;
  tags: string[];
  url: string;
}

export interface TrackCollectionCreation {
  id: string;
  name: string;
  description?: string;
  tracks: CollectionTrackCreation[];
}

export interface TrackCollectionImportFromSession {
  sessionId: string
  id: string;
  name: string;
  description?: string;

  override?: boolean;
}

export interface TrackCollectionUpdate {
  id: string;
  name: string;
  description?: string;
  tracks: CollectionTrackCreation[];
}

import { Track } from './Track';
import { UserID } from './User';
import { TrackCreation } from './TrackCreation';

export interface TrackCollection {
  id: string;
  name: string;
  description: string | null;
  tracks: Track[];
  created_at: number;
  updated_at: number;
  created_by: UserID;
}

export interface TrackCollectionCreation {
  id: string;
  name: string;
  description?: string;
  tracks: TrackCreation[];
}

export interface TrackCollectionUpdate {
  id: string;
  name: string;
  description?: string;
  tracks: TrackCreation[];
}

import { Track } from '../model/Track';

export interface Database {
  save: (track: Track) => Promise<void>;
}
import { TrackSource } from './TrackSource';

export class Track {
  id: string;
  created_at: number;
  updated_at: number;
  source: TrackSource;

  name: string;
  length: number;
  tags: string[];
  url: string;


}

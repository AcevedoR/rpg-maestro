import { TrackSource } from "./TrackSource";

export interface Track {
  id: string;
  created_at: number;
  updated_at: number;
  source: TrackSource;

  name: string;
  duration: number;
  tags: string[];
  url: string;
}

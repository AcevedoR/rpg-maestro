import { TrackToPlay } from './TrackToPlay';

export interface ChangeSessionPlayingTracksRequest {
  currentTrack?: TrackToPlay;
  shortEffectTrack?: TrackToPlay;
}

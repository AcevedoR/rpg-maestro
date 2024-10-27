export class PlayingTrack {
  id: string;

  constructor(
    id: string,
    name: string,
    duration: number,
    isPaused: boolean,
    playTimestamp: number,
    trackStartTime: number
  ) {
    this.id = id;
    this.name = name;
    this.duration = duration;
    this.isPaused = isPaused;
    this.playTimestamp = playTimestamp;
    this.trackStartTime = trackStartTime;
  }

  name: string;
  duration: number;

  isPaused: boolean;
  playTimestamp: number;
  trackStartTime: number;

  getCurrentPlayTime(): number | null {
    if (this.isPaused) {
      return null;
    }
    if (this.playTimestamp > Date.now()) {
      return null;
    }
    const elapsedPlayTime = Date.now() - this.playTimestamp;
    const timeTheTrackWasPlayed = elapsedPlayTime + this.trackStartTime;
    return timeTheTrackWasPlayed % this.duration;
  }
}

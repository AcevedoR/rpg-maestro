export class PlayingTrack {
  id: string;
  name: string;
  url: string;
  duration: number;

  isPaused: boolean;
  playTimestamp: number;
  trackStartTime: number;

  constructor(
    id: string,
    name: string,
    url: string,
    duration: number,
    isPaused: boolean,
    playTimestamp: number,
    trackStartTime: number
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.duration = duration;
    this.isPaused = isPaused;
    this.playTimestamp = playTimestamp;
    this.trackStartTime = trackStartTime;
  }

  getCurrentPlayTime(): number {
    if (this.playTimestamp > Date.now()) {
      throw new Error('this.playTimestamp in the future are not handled');
    }
    if (this.isPaused) {
      return this.trackStartTime;
    }
    const elapsedPlayTime = Date.now() - this.playTimestamp;
    const timeTheTrackWasPlayed = elapsedPlayTime + this.trackStartTime;
    return timeTheTrackWasPlayed % this.duration;
  }
}

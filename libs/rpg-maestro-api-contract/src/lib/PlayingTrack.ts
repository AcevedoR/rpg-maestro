/**
 * How far in the future a `playTimestamp` may sit before it is worth complaining about. A client's
 * estimate of the server clock is only as good as the round trip it measured it with, so a change
 * stamped a moment ago can legitimately read as "in the future".
 */
export const CLOCK_SKEW_TOLERANCE_MS = 2000;

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

  /**
   * Where the playhead should be right now.
   *
   * @param serverNowMs epoch ms **on the server clock**, the clock `playTimestamp` was stamped in.
   * Callers in the browser must not pass `Date.now()`: browser clocks are routinely seconds off, and
   * that error lands straight on the playhead, leaving every listener somewhere else in the track. Use
   * `serverNow()` from `utils/server-time.ts` instead.
   */
  getCurrentPlayTime(serverNowMs: number): number {
    if (this.isPaused) {
      return this.trackStartTime;
    }
    const elapsedPlayTime = serverNowMs - this.playTimestamp;
    if (elapsedPlayTime < 0) {
      // A timestamp in the future means the caller's idea of the server clock is wrong — the server
      // never stamps one. Within the tolerance that is just noise in the offset measurement; beyond it
      // the clock estimate is broken, and there is no playhead to compute from it. Either way the
      // track starts where it was asked to start, because refusing to play at all would be worse than
      // starting a few seconds early.
      if (elapsedPlayTime < -CLOCK_SKEW_TOLERANCE_MS) {
        console.warn(
          `playTimestamp is ${-elapsedPlayTime}ms in the future, the clock this was compared against is off`
        );
      }
      return this.trackStartTime % this.duration;
    }
    const timeTheTrackWasPlayed = elapsedPlayTime + this.trackStartTime;
    return timeTheTrackWasPlayed % this.duration;
  }
}

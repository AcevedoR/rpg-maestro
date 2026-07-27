export class PlayingTrack {
  id: string;
  name: string;
  url: string;
  duration: number;

  isPaused: boolean;
  playTimestamp: number;
  trackStartTime: number;
  /**
   * Monotonic counter, bumped by the server every time this slot of the session is written. It is what a
   * client compares to decide "did the server change this track?". `playTimestamp` used to serve that
   * purpose, but it is a wall-clock reading, so across several backend instances it is not guaranteed to
   * move forward between two consecutive writes.
   */
  revision: number;

  constructor(
    id: string,
    name: string,
    url: string,
    duration: number,
    isPaused: boolean,
    playTimestamp: number,
    trackStartTime: number,
    revision = 0
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.duration = duration;
    this.isPaused = isPaused;
    this.playTimestamp = playTimestamp;
    this.trackStartTime = trackStartTime;
    this.revision = revision;
  }

  /**
   * Where the playhead should be, in ms.
   *
   * `nowMs` must come from the same clock that produced `playTimestamp` — the server's. Browser callers
   * must NOT let it default to their own `Date.now()`: the result would be wrong by the entire
   * browser-to-server clock offset. The server computes this once and ships it to clients as
   * `SessionPlayingTracksResponse.currentPlayTimeMs`.
   */
  getCurrentPlayTime(nowMs: number = Date.now()): number {
    if (this.isPaused) {
      return this.trackStartTime;
    }
    // A timestamp in the future means the caller's clock trails whichever clock wrote it. Clamping to
    // "no time elapsed yet" is wrong by at most that skew; throwing (which this used to do) took down
    // the caller's entire sync tick instead, and every tick after it.
    const elapsedPlayTime = Math.max(0, nowMs - this.playTimestamp);
    const timeTheTrackWasPlayed = elapsedPlayTime + this.trackStartTime;
    return timeTheTrackWasPlayed % this.duration;
  }
}

/**
 * Rebuild a real PlayingTrack from a plain object.
 *
 * Anything that has been through JSON — an HTTP response, or the Keyv-backed session cache, which
 * serializes even for its in-process store — hands back an object with the right fields and none of the
 * methods. Call this at every such boundary, or `getCurrentPlayTime` blows up with "is not a function".
 */
export function rehydratePlayingTrack(plain: PlayingTrack): PlayingTrack {
  return new PlayingTrack(
    plain.id,
    plain.name,
    plain.url,
    plain.duration,
    plain.isPaused,
    plain.playTimestamp,
    plain.trackStartTime,
    plain.revision ?? 0
  );
}

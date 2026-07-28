import { CLOCK_SKEW_TOLERANCE_MS, PlayingTrack } from "./PlayingTrack";

const SERVER_NOW = 1730000015000;

describe("PlayingTrack getCurrentPlayTime()", () => {
  it("should return last track start time when it was paused", () => {
    const pausedTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      495046.531,
      true,
      Number.MIN_VALUE,
      10563
    );
    expect(pausedTrack.getCurrentPlayTime(SERVER_NOW)).toBe(10563);
  });
  it("should start the track from the beginning, loudly, when the clock it is compared against is broken", () => {
    // Only a caller whose idea of the server clock is wrong sees a timestamp in the future — the server
    // never stamps one. Playing from the requested start beats refusing to play.
    const warn = vitest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      false,
      SERVER_NOW + 60 * 60 * 1000,
      3000
    );

    expect(playingTrack.getCurrentPlayTime(SERVER_NOW)).toBe(3000);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
  it("should start where the track was asked to start when the clock estimate is off by less than the tolerance", () => {
    // What a client sees when its measured offset is a few dozen milliseconds optimistic: the timestamp
    // reads as barely in the future, which is measurement noise rather than a broken clock.
    const playTimestampSlightlyAhead = SERVER_NOW + CLOCK_SKEW_TOLERANCE_MS - 1;
    const trackStartTime20s = 20000;

    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      false,
      playTimestampSlightlyAhead,
      trackStartTime20s
    );
    expect(playingTrack.getCurrentPlayTime(SERVER_NOW)).toBe(trackStartTime20s);
  });
  it("should return the current time the track is playing when it was started from 0", () => {
    const playTimestamp15sAgo = SERVER_NOW - 15000;
    const trackStartTime = 0;

    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      false,
      playTimestamp15sAgo,
      trackStartTime
    );
    expect(playingTrack.getCurrentPlayTime(SERVER_NOW)).toBe(15000);
  });
  it("should return the current time the track is playing when it was already started", () => {
    const playTimestamp15sAgo = SERVER_NOW - 15000;
    const trackStartTime20s = 20000;

    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      false,
      playTimestamp15sAgo,
      trackStartTime20s
    );
    expect(playingTrack.getCurrentPlayTime(SERVER_NOW)).toBe(35000);
  });
  it("should handle the track looping when finished when starting from 0", () => {
    const playTimestamp = SERVER_NOW - 230000;
    const trackStartTime = 0;
    const duration = 120000;

    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      duration,
      false,
      playTimestamp,
      trackStartTime
    );
    expect(playingTrack.getCurrentPlayTime(SERVER_NOW)).toBe(110000);
  });
  it("should ignore this machine's own clock, and use only the server clock it is given", () => {
    // The whole point of the parameter: a browser three hours behind still lands on the playhead
    // everyone else is at, because it corrected for its offset before calling this.
    vitest.useFakeTimers().setSystemTime(new Date(SERVER_NOW - 3 * 60 * 60 * 1000));
    try {
      const playingTrack = new PlayingTrack("id1", "name1", "url", 120000, false, SERVER_NOW - 15000, 0);
      expect(playingTrack.getCurrentPlayTime(SERVER_NOW)).toBe(15000);
    } finally {
      vitest.useRealTimers();
    }
  });
});

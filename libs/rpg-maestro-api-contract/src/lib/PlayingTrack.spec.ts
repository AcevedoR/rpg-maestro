import { PlayingTrack } from "./PlayingTrack";

const NOW = new Date(1730000015000);

beforeAll(() => {
  vitest.useFakeTimers().setSystemTime(NOW);
});

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
    expect(pausedTrack.getCurrentPlayTime()).toBe(10563);
  });
  // Used to throw. A caller whose clock trails the writer's hits this on every single tick, and the throw
  // took down their whole sync loop rather than just this reading, so it now clamps to "not started yet".
  it("should clamp to the track start time when the track is set to play in the future", () => {
    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      false,
      Number.MAX_VALUE,
      7000
    );
    expect(playingTrack.getCurrentPlayTime()).toBe(7000);
  });
  it("should resolve against the clock it is given rather than the local one", () => {
    const trackStartedAt = 1730000000000;
    const playingTrack = new PlayingTrack("id1", "name1", "url", 120000, false, trackStartedAt, 0);

    // A browser 40s behind the server would compute 40s less than the server does. Passing the server's
    // clock explicitly is what keeps every listener on the same playhead.
    expect(playingTrack.getCurrentPlayTime(trackStartedAt + 15000)).toBe(15000);
    expect(playingTrack.getCurrentPlayTime(trackStartedAt - 40000)).toBe(0);
  });
  it("should return the current time the track is playing when it was started from 0", () => {
    const playTimestamp15sAgo = NOW.getTime() - 15000;
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
    expect(playingTrack.getCurrentPlayTime()).toBe(15000);
  });
  it("should return the current time the track is playing when it was already started", () => {
    const playTimestamp15sAgo = NOW.getTime() - 15000;
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
    expect(playingTrack.getCurrentPlayTime()).toBe(35000);
  });
  it("should handle the track looping when finished when starting from 0", () => {
    const playTimestamp = NOW.getTime() - 230000;
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
    expect(playingTrack.getCurrentPlayTime()).toBe(110000);
  });
});

import { PlayingTrack } from "./PlayingTrack";

const NOW = new Date(1730000015000);

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(NOW);
});

describe("PlayingTrack getCurrentPlayTime()", () => {
  it("should return null when paused", () => {
    const pausedTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      true,
      Number.MIN_VALUE,
      0
    );
    expect(pausedTrack.getCurrentPlayTime()).toBe(null);
  });
  it("should return null when the track is set to play in the future", () => {
    const playingTrack = new PlayingTrack(
      "id1",
      "name1",
      "url",
      120000,
      false,
      Number.MAX_VALUE,
      0
    );
    expect(playingTrack.getCurrentPlayTime()).toBe(null);
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

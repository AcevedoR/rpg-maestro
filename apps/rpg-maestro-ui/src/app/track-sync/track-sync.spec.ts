import {
  isCurrentTrackOutOfDate,
  isCurrentTrackTooMuchDesynchronizedFromServer,
  resolveSync,
} from './track-sync';
import { describe } from 'vitest';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';

const SERVER_NOW = 1730000015000;
describe('track-sync tests', () => {
  describe('isCurrentTrackTooMuchDesynchronizedFromServer', () => {
    const serverTrackRunningFor15Seconds = new PlayingTrack(
      '1',
      '1',
      'url',
      120000,
      false,
      1730000000000,
      0
    );
    it('true for more than 5 seconds', () => {
      const currentTrack = 21000;
      expect(
        isCurrentTrackTooMuchDesynchronizedFromServer(
          currentTrack,
          serverTrackRunningFor15Seconds,
          SERVER_NOW
        )
      ).toBeTruthy();
    });
    it('false for 2 seconds advance', () => {
      const currentTrack = 16999;
      expect(
        isCurrentTrackTooMuchDesynchronizedFromServer(
          currentTrack,
          serverTrackRunningFor15Seconds,
          SERVER_NOW
        )
      ).toBeFalsy();
    });
    it('false for 2 seconds delay', () => {
      const currentTrack = 14001;
      expect(
        isCurrentTrackTooMuchDesynchronizedFromServer(
          currentTrack,
          serverTrackRunningFor15Seconds,
          SERVER_NOW
        )
      ).toBeFalsy();
    });
  });
  describe('isCurrentTrackOutOfDate', () => {
    it('perfectly in sync', () => {
      const serverTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        false,
        1730000000000,
        0
      );
      const currentTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        false,
        1730000000000,
        0
      );
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeFalsy();
    });
    it('server just paused', () => {
      const serverTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        true,
        1730000000000,
        0
      );
      const currentTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        false,
        1730000000000,
        0
      );
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    it('server just started', () => {
      const serverTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        false,
        1730000000000,
        0
      );
      const currentTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        true,
        1730000000000,
        0
      );
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    it('server just updated current play time', () => {
      const justUpdatedPlayTimestamp = 1730000000001;
      const serverTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        true,
        justUpdatedPlayTimestamp,
        0
      );
      const currentTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        true,
        1730000000000,
        0
      );
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    it('server changed track', () => {
      const serverTrack = new PlayingTrack(
        'new-track-id',
        '1',
        'url',
        120000,
        true,
        1730000000000,
        0
      );
      const currentTrack = new PlayingTrack(
        '1',
        '1',
        'url',
        120000,
        true,
        1730000000000,
        0
      );
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
  });
});

describe('resolveSync', () => {
  const aTrack = (id: string, playTimestamp: number) => new PlayingTrack(id, id, 'url', 120000, false, playTimestamp, 0);
  const serverState = (currentTrack: PlayingTrack | null, shortEffectTrack: PlayingTrack | null = null): SessionPlayingTracks => ({
    sessionId: 'a-session',
    currentTrack,
    shortEffectTrack,
  });

  it('hands back the server track when the browser has nothing playing yet', () => {
    const serverTrack = aTrack('1', 1730000000000);

    expect(resolveSync(serverState(serverTrack), null, null, null, SERVER_NOW).currentTrack).toBe(serverTrack);
  });

  it('asks for no change when the browser already plays that track at that position', () => {
    const serverTrack = aTrack('1', 1730000000000);
    const playTimeInSeconds = 15;

    expect(resolveSync(serverState(serverTrack), playTimeInSeconds, aTrack('1', 1730000000000), null, SERVER_NOW))
      .toEqual({ currentTrack: null, shortEffectTrack: null });
  });

  it('hands back the server track when the Maestro switched track', () => {
    const serverTrack = aTrack('2', 1730000000000);

    expect(resolveSync(serverState(serverTrack), 15, aTrack('1', 1730000000000), null, SERVER_NOW).currentTrack).toBe(
      serverTrack
    );
  });

  it('replays a short effect only when it is a new one', () => {
    const effect = aTrack('effect', 1730000010000);

    expect(resolveSync(serverState(null, effect), null, null, effect, SERVER_NOW).shortEffectTrack).toBeNull();
    expect(resolveSync(serverState(null, effect), null, null, aTrack('effect', 1730000005000), SERVER_NOW).shortEffectTrack).toBe(
      effect
    );
  });

  it('decides on the server clock it is given, not on this browser one', () => {
    // A browser one hour behind: reading the playhead on its own clock would put the server track an
    // hour into the past, and the desync check would fire on every single sync.
    const serverTrack = aTrack('1', SERVER_NOW - 15000);
    const anHourBehind = SERVER_NOW - 3600_000;

    expect(resolveSync(serverState(serverTrack), 15, aTrack('1', SERVER_NOW - 15000), null, SERVER_NOW).currentTrack).toBeNull();
    expect(resolveSync(serverState(serverTrack), 15, aTrack('1', SERVER_NOW - 15000), null, anHourBehind).currentTrack).toBe(
      serverTrack
    );
  });
});

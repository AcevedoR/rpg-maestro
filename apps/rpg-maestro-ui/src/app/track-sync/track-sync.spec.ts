import {
  isCurrentTrackOutOfDate,
  isCurrentTrackTooMuchDesynchronizedFromServer,
} from './track-sync';
import { PlayingTrack } from '../PlayingTrack';
import { afterAll, describe } from 'vitest';

const NOW = new Date(1730000015000);

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
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
          serverTrackRunningFor15Seconds
        )
      ).toBeTruthy();
    });
    it('false for 2 seconds advance', () => {
      const currentTrack = 16999;
      expect(
        isCurrentTrackTooMuchDesynchronizedFromServer(
          currentTrack,
          serverTrackRunningFor15Seconds
        )
      ).toBeFalsy();
    });
    it('false for 2 seconds delay', () => {
      const currentTrack = 14001;
      expect(
        isCurrentTrackTooMuchDesynchronizedFromServer(
          currentTrack,
          serverTrackRunningFor15Seconds
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
afterAll(() => {
  vi.useRealTimers();
});

import {
  isCurrentTrackOutOfDate,
  isCurrentTrackTooMuchDesynchronizedFromServer,
} from './track-sync';
import { afterAll, describe } from 'vitest';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';

const NOW = new Date(1730000015000);

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
describe('track-sync tests', () => {
  describe('isCurrentTrackTooMuchDesynchronizedFromServer', () => {
    // The server resolves its own playhead and sends it; this function only ever compares two numbers, so
    // it no longer depends on any clock — that is the whole point of the change.
    const serverPlayTimeMs = 15000;
    it('true for more than 5 seconds', () => {
      expect(isCurrentTrackTooMuchDesynchronizedFromServer(21000, serverPlayTimeMs)).toBeTruthy();
    });
    it('false for 2 seconds advance', () => {
      expect(isCurrentTrackTooMuchDesynchronizedFromServer(16999, serverPlayTimeMs)).toBeFalsy();
    });
    it('false for 2 seconds delay', () => {
      expect(isCurrentTrackTooMuchDesynchronizedFromServer(14001, serverPlayTimeMs)).toBeFalsy();
    });
    it('false when the server reports no playhead, so nothing gets reseeked blindly', () => {
      expect(isCurrentTrackTooMuchDesynchronizedFromServer(21000, null)).toBeFalsy();
    });
    it('true at 0, which must not be mistaken for "no playhead"', () => {
      expect(isCurrentTrackTooMuchDesynchronizedFromServer(21000, 0)).toBeTruthy();
    });
  });
  describe('isCurrentTrackOutOfDate', () => {
    const REVISION = 4;
    it('perfectly in sync', () => {
      const serverTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000000000, 0, REVISION);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000000000, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeFalsy();
    });
    it('server just paused', () => {
      const serverTrack = new PlayingTrack('1', '1', 'url', 120000, true, 1730000000000, 0, REVISION + 1);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000000000, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    it('server just started', () => {
      const serverTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000000000, 0, REVISION + 1);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, true, 1730000000000, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    it('server just updated current play time', () => {
      const serverTrack = new PlayingTrack('1', '1', 'url', 120000, true, 1730000000001, 0, REVISION + 1);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, true, 1730000000000, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    it('server changed track', () => {
      const serverTrack = new PlayingTrack('new-track-id', '1', 'url', 120000, true, 1730000000000, 0, REVISION + 1);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, true, 1730000000000, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    // The regression this whole change is about: two backend instances with skewed clocks can write a
    // playTimestamp that moves backwards. Detection must not care.
    it('server rewrote the track with an earlier playTimestamp than the browser holds', () => {
      const serverTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000000000, 0, REVISION + 1);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000009999, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeTruthy();
    });
    // Mirror case: an unchanged track whose stored playTimestamp differs must not trigger an endless
    // reseek. Under the old playTimestamp comparison this returned true on every single tick.
    it('same revision is in sync even if playTimestamp differs', () => {
      const serverTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000000000, 0, REVISION);
      const currentTrack = new PlayingTrack('1', '1', 'url', 120000, false, 1730000009999, 0, REVISION);
      expect(isCurrentTrackOutOfDate(currentTrack, serverTrack)).toBeFalsy();
    });
  });
});
afterAll(() => {
  vi.useRealTimers();
});

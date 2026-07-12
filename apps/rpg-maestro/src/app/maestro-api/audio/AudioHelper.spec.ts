import { describe, it, expect } from 'vitest';
import { toDurationInMs } from './AudioHelper';

describe('toDurationInMs', () => {
  it('converts whole seconds to milliseconds', () => {
    expect(toDurationInMs(121)).toBe(121000);
  });

  it('returns an integer number of milliseconds when the probed duration has decimals', () => {
    // ffprobe reports fractional seconds, e.g. 50.717211s -> 50717.211ms before rounding (see issue #37)
    const durationInMs = toDurationInMs(50.717211);

    expect(Number.isInteger(durationInMs)).toBe(true);
    expect(durationInMs).toBe(50717);
  });

  it('rounds to the nearest millisecond', () => {
    expect(toDurationInMs(1.4885)).toBe(1489);
    expect(toDurationInMs(1.4884)).toBe(1488);
  });
});

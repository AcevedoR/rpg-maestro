import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bestOffset,
  getServerTimeOffsetMs,
  measureOffset,
  resetServerTimeOffset,
  serverNow,
  syncServerTime,
} from './server-time';

const fetchMock = vi.fn();

describe('measureOffset', () => {
  it('assumes the server read its clock halfway through the round trip', () => {
    // server said 5100 at what was, from here, local time 1100
    expect(measureOffset({ sentAt: 1000, serverTime: 5100, receivedAt: 1200 })).toEqual({
      offsetMs: 4000,
      roundTripMs: 200,
    });
  });

  it('reports no offset when this clock already agrees with the server', () => {
    expect(measureOffset({ sentAt: 1000, serverTime: 1050, receivedAt: 1100 })).toEqual({
      offsetMs: 0,
      roundTripMs: 100,
    });
  });
});

describe('bestOffset', () => {
  it('keeps the sample with the shortest round trip, since a slow response hides an asymmetric delay', () => {
    const fast = { sentAt: 1000, serverTime: 1010, receivedAt: 1020 };
    const slow = { sentAt: 2000, serverTime: 2010, receivedAt: 3000 };

    expect(bestOffset([slow, fast])).toEqual({ offsetMs: 0, roundTripMs: 20 });
  });

  it('has nothing to say when no sample was taken', () => {
    expect(bestOffset([])).toBeNull();
  });
});

describe('syncServerTime', () => {
  beforeEach(() => {
    resetServerTimeOffset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    resetServerTimeOffset();
    vi.unstubAllGlobals();
  });

  it('corrects this browser clock towards the server one', async () => {
    const oneHourAhead = Date.now() + 3600_000;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ serverTime: oneHourAhead }) });

    await syncServerTime();

    expect(getServerTimeOffsetMs()).toBeGreaterThan(3599_000);
    expect(serverNow()).toBeGreaterThan(oneHourAhead - 1000);
  });

  it('leaves the offset alone when the server cannot be reached', async () => {
    const oneHourAhead = Date.now() + 3600_000;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ serverTime: oneHourAhead }) });
    await syncServerTime();
    const measuredOffset = getServerTimeOffsetMs();
    fetchMock.mockRejectedValue(new Error('offline'));

    await syncServerTime();

    // A stale offset is far closer to the truth than falling back to this browser's raw clock, and a
    // failed refresh is no reason to stop the music.
    expect(getServerTimeOffsetMs()).toBe(measuredOffset);
  });

  it('does not trust a non-ok answer', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({ serverTime: 0 }) });

    await syncServerTime();

    expect(getServerTimeOffsetMs()).toBe(0);
  });
});

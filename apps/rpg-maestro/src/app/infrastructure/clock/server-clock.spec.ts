import { bestOffset, ClockSample, measureOffset, ServerClock } from './server-clock';
import { TimeReference } from './time-reference';

class FakeTimeReference implements TimeReference {
  readonly name = 'fake';
  reads = 0;

  constructor(private readonly behaviour: (read: number) => number) {}

  async read(): Promise<number> {
    this.reads++;
    return this.behaviour(this.reads);
  }

  async close(): Promise<void> {
    // nothing to close
  }
}

describe('measureOffset', () => {
  it('assumes the reference was read halfway through the round trip', () => {
    const sample: ClockSample = { localSentAt: 1000, referenceTime: 5100, localReceivedAt: 1200 };

    // reference read at local 1100 (the midpoint) while it said 5100, so we are 4000ms behind it
    expect(measureOffset(sample)).toEqual({ offsetMs: 4000, roundTripMs: 200 });
  });

  it('reports no offset when the reference agrees with the local clock', () => {
    const sample: ClockSample = { localSentAt: 1000, referenceTime: 1050, localReceivedAt: 1100 };

    expect(measureOffset(sample)).toEqual({ offsetMs: 0, roundTripMs: 100 });
  });
});

describe('bestOffset', () => {
  it('keeps the sample with the shortest round trip, since a slow read hides an asymmetric delay', () => {
    const fast: ClockSample = { localSentAt: 1000, referenceTime: 1010, localReceivedAt: 1020 };
    // a queued read, whose midpoint guess is off by the whole queueing delay
    const slow: ClockSample = { localSentAt: 2000, referenceTime: 2010, localReceivedAt: 3000 };

    expect(bestOffset([slow, fast])).toEqual({ offsetMs: 0, roundTripMs: 20 });
  });

  it('has nothing to say when no sample was taken', () => {
    expect(bestOffset([])).toBeNull();
  });
});

describe('ServerClock', () => {
  it('is the local clock when no reference is configured', async () => {
    const clock = new ServerClock(null);

    await clock.resync();

    expect(clock.getOffsetMs()).toBe(0);
    expect(clock.now()).toBeCloseTo(Date.now(), -2);
  });

  it('corrects the local clock towards the reference', async () => {
    const oneHourAhead = Date.now() + 3600_000;
    const clock = new ServerClock(new FakeTimeReference(() => oneHourAhead));

    await clock.resync();

    expect(clock.getOffsetMs()).toBeGreaterThan(3599_000);
    expect(clock.now()).toBeGreaterThan(oneHourAhead - 1000);
  });

  it('keeps the last known offset when the reference stops answering', async () => {
    const reference = new FakeTimeReference((read) => {
      if (read > 5) {
        throw new Error('reference is down');
      }
      return Date.now() + 3600_000;
    });
    const clock = new ServerClock(reference);
    await clock.resync();
    const offsetWhileHealthy = clock.getOffsetMs();

    await clock.resync();

    // A stale correction is much closer to the truth than dropping back to the raw local clock.
    expect(clock.getOffsetMs()).toBe(offsetWhileHealthy);
  });
});

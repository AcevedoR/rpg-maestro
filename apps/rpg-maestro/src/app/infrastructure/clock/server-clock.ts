import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, Optional } from '@nestjs/common';
import ms from 'ms';
import { TimeReference } from './time-reference';

export const TIME_REFERENCE = 'TIME_REFERENCE';

/** How often the local offset against the reference is measured again. */
export const RESYNC_INTERVAL_MS = ms('30s');

/** Reads per measurement. The one with the shortest round trip wins, see {@link bestOffset}. */
export const SAMPLES_PER_RESYNC = 5;

/** Above this, the local clock is off by enough to be audible, so it is worth a log line. */
export const NOTEWORTHY_OFFSET_MS = 250;

export interface ClockSample {
  /** Local epoch ms just before the read was issued. */
  localSentAt: number;
  /** What the reference answered. */
  referenceTime: number;
  /** Local epoch ms just after the answer came back. */
  localReceivedAt: number;
}

export interface ClockMeasurement {
  /** Add this to `Date.now()` to get the reference's time. */
  offsetMs: number;
  roundTripMs: number;
}

/**
 * NTP's estimator, with the two timestamps the reference does not give us folded away: the reference
 * read happened somewhere inside our round trip, and the midpoint is the least-wrong guess.
 */
export function measureOffset(sample: ClockSample): ClockMeasurement {
  const roundTripMs = sample.localReceivedAt - sample.localSentAt;
  return {
    offsetMs: sample.referenceTime + roundTripMs / 2 - sample.localReceivedAt,
    roundTripMs,
  };
}

/**
 * The shortest round trip, not the average: a slow read is slow because something queued, and
 * queueing is asymmetric, which is exactly what the midpoint guess above cannot model. Averaging
 * would fold that error in instead of discarding it.
 */
export function bestOffset(samples: ClockSample[]): ClockMeasurement | null {
  return samples
    .map(measureOffset)
    .reduce<ClockMeasurement | null>((best, m) => (best === null || m.roundTripMs < best.roundTripMs ? m : best), null);
}

/**
 * The clock every playback timestamp is expressed in.
 *
 * Instances correct their own wall clock against a single {@link TimeReference}, so a track change
 * stamped by one pod means the same instant as one stamped by another. Without a reference
 * configured — local dev, tests — this is `Date.now()` and the offset stays 0, which is correct
 * there since there is only one clock in play.
 *
 * Clients must not compare these timestamps against their own `Date.now()`: they negotiate their own
 * offset against `GET /server-time`, which reads this same clock.
 */
@Injectable()
export class ServerClock implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ServerClock.name);
  private offsetMs = 0;
  private resyncTimer: NodeJS.Timeout | null = null;

  constructor(@Optional() @Inject(TIME_REFERENCE) private readonly reference: TimeReference | null) {}

  /** Epoch ms on the shared clock. */
  now(): number {
    return Date.now() + this.offsetMs;
  }

  getOffsetMs(): number {
    return this.offsetMs;
  }

  /** Name of the shared clock being followed, or `null` when the local clock is the authority. */
  getReferenceName(): string | null {
    return this.reference?.name ?? null;
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.reference) {
      this.logger.log('no time reference configured, playback timestamps use the local clock');
      return;
    }
    this.logger.log(`using "${this.reference.name}" as the time reference for playback timestamps`);
    await this.resync();
    this.resyncTimer = setInterval(() => {
      this.resync().catch((error) => this.logger.warn('clock resync threw', error));
    }, RESYNC_INTERVAL_MS);
    // Nothing should be kept alive by a clock: without this, a failing e2e run or test suite hangs
    // on an open handle instead of exiting.
    this.resyncTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.resyncTimer) {
      clearInterval(this.resyncTimer);
      this.resyncTimer = null;
    }
    await this.reference?.close();
  }

  /**
   * Measures the offset again. A failure keeps the last known offset: a stale correction is much
   * closer to the truth than dropping back to the raw local clock, and the reference being
   * unreachable is not a reason to stop serving music.
   */
  async resync(): Promise<void> {
    if (!this.reference) {
      return;
    }
    const samples: ClockSample[] = [];
    for (let i = 0; i < SAMPLES_PER_RESYNC; i++) {
      try {
        const localSentAt = Date.now();
        const referenceTime = await this.reference.read();
        samples.push({ localSentAt, referenceTime, localReceivedAt: Date.now() });
      } catch (error) {
        this.logger.warn(`time reference "${this.reference.name}" could not be read`, error);
        break;
      }
    }
    const measurement = bestOffset(samples);
    if (!measurement) {
      this.logger.warn(
        `time reference "${this.reference.name}" is unreachable, keeping the last known offset of ${this.offsetMs}ms`
      );
      return;
    }
    const previousOffsetMs = this.offsetMs;
    this.offsetMs = Math.round(measurement.offsetMs);
    if (
      Math.abs(this.offsetMs) >= NOTEWORTHY_OFFSET_MS ||
      Math.abs(this.offsetMs - previousOffsetMs) >= NOTEWORTHY_OFFSET_MS
    ) {
      this.logger.log(
        `local clock is ${this.offsetMs}ms off "${this.reference.name}" (was ${previousOffsetMs}ms), ` +
          `round trip ${measurement.roundTripMs}ms`
      );
    }
  }
}

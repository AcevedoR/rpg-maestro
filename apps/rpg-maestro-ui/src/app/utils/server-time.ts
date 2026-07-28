import { ServerTime } from '@rpg-maestro/rpg-maestro-api-contract';
import { rpgMaestroApiUrl } from './api-config';

/**
 * The browser's estimate of the server clock.
 *
 * Playback positions are reconstructed from `PlayingTrack.playTimestamp`, which the server stamps on
 * *its* clock. A browser's `Date.now()` is routinely seconds away from it — nothing forces a laptop's
 * clock to be right — and that whole error lands on the playhead, so two listeners in the same room
 * would sit seconds apart in the same track. Measuring the offset once and correcting for it removes
 * that error, and leaves only what the measurement itself is worth: half a round trip, so tens of
 * milliseconds, which nobody hears.
 */

/** How often the offset is measured again, to follow the browser clock's own drift. */
export const RESYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Reads per measurement. The one with the shortest round trip wins, see {@link bestOffset}. */
export const SAMPLES_PER_RESYNC = 3;

export interface ServerTimeSample {
  /** Local epoch ms just before the request went out. */
  sentAt: number;
  /** What the server answered. */
  serverTime: number;
  /** Local epoch ms just after the answer came back. */
  receivedAt: number;
}

export interface ServerTimeMeasurement {
  /** Add this to `Date.now()` to get the server's clock. */
  offsetMs: number;
  roundTripMs: number;
}

/**
 * NTP's estimator: the server read its clock somewhere inside our round trip, and the midpoint is the
 * least-wrong guess as to when.
 */
export function measureOffset(sample: ServerTimeSample): ServerTimeMeasurement {
  const roundTripMs = sample.receivedAt - sample.sentAt;
  return {
    offsetMs: sample.serverTime + roundTripMs / 2 - sample.receivedAt,
    roundTripMs,
  };
}

/**
 * The shortest round trip, not the average: a slow response is slow because something queued, and
 * queueing is asymmetric — exactly what the midpoint guess above cannot model. Averaging would fold
 * that error in instead of throwing it away.
 */
export function bestOffset(samples: ServerTimeSample[]): ServerTimeMeasurement | null {
  return samples
    .map(measureOffset)
    .reduce<ServerTimeMeasurement | null>(
      (best, measurement) => (best === null || measurement.roundTripMs < best.roundTripMs ? measurement : best),
      null
    );
}

let offsetMs = 0;

/** Epoch ms on the server clock, as best as this browser can tell. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function getServerTimeOffsetMs(): number {
  return offsetMs;
}

async function readServerTime(): Promise<ServerTimeSample | null> {
  try {
    const sentAt = Date.now();
    const response = await fetch(`${rpgMaestroApiUrl}/server-time`);
    const receivedAt = Date.now();
    if (!response.ok) {
      return null;
    }
    const { serverTime } = (await response.json()) as ServerTime;
    return { sentAt, serverTime, receivedAt };
  } catch (error) {
    console.warn('could not read the server time', error);
    return null;
  }
}

/**
 * Measures the offset against the server clock.
 *
 * A failure is deliberately silent, and leaves the previous offset in place: the offset only makes
 * playback *more* accurate, so failing to refresh it is no reason to bother the user — the audio keeps
 * playing either way.
 */
export async function syncServerTime(): Promise<void> {
  const samples: ServerTimeSample[] = [];
  for (let i = 0; i < SAMPLES_PER_RESYNC; i++) {
    const sample = await readServerTime();
    if (!sample) {
      break;
    }
    samples.push(sample);
  }
  const measurement = bestOffset(samples);
  if (!measurement) {
    return;
  }
  offsetMs = Math.round(measurement.offsetMs);
  console.info(`clock is ${offsetMs}ms off the server's, round trip ${measurement.roundTripMs}ms`);
}

/** Starts following the server clock. Returns the function that stops it. */
export function startServerTimeSync(): () => void {
  syncServerTime();
  const id = setInterval(() => {
    syncServerTime();
  }, RESYNC_INTERVAL_MS);
  return () => clearInterval(id);
}

/** For tests only: forgets the measured offset. */
export function resetServerTimeOffset(): void {
  offsetMs = 0;
}

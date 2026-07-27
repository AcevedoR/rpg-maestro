import { Logger } from '@nestjs/common';
import ms from 'ms';

/**
 * Minimal contract a cache backend must satisfy. `Keyv` matches it structurally, which keeps
 * {@link ResilientCache} testable without a real Redis.
 */
export interface CacheStore<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  clear(): Promise<unknown>;
}

export interface CacheTier<T> {
  /** Used in logs only. */
  readonly name: string;
  readonly store: CacheStore<T>;
}

/** Consecutive failures before a tier is taken out of rotation. */
export const FAILURE_THRESHOLD = 3;

/** How long a tier stays out of rotation before the next operation probes it again. */
export const PROBE_INTERVAL_MS = ms('30s');

interface TierState {
  consecutiveFailures: number;
  /** Epoch ms before which the tier must not be called. `null` means the tier is healthy. */
  unhealthyUntil: number | null;
}

/**
 * A cache spread over several backends where exactly **one tier is active at a time**, picked by
 * health in declaration order. There is no cascade: a miss on the active tier is a miss, and the
 * caller falls back to the database. When every tier is down the cache degrades to no cache at all
 * rather than to a slower one.
 *
 * Two rules keep a dormant tier from waking up with stale data, given that writes only ever reach
 * the active tier:
 * - a write invalidates the key on every other healthy tier (write to one, delete from all);
 * - a tier that failed and later recovers has its namespace cleared before it serves anything,
 *   since it missed every invalidation during the outage.
 */
export class ResilientCache<T> {
  private readonly logger = new Logger(ResilientCache.name);
  private readonly states = new Map<string, TierState>();

  constructor(private readonly tiers: CacheTier<T>[]) {
    for (const tier of tiers) {
      if (this.states.has(tier.name)) {
        throw new Error(`duplicate cache tier name "${tier.name}", tier names must be unique`);
      }
      this.states.set(tier.name, { consecutiveFailures: 0, unhealthyUntil: null });
    }
  }

  async get(key: string): Promise<T | undefined> {
    const tier = await this.activeTier();
    if (!tier) {
      return undefined;
    }
    try {
      const value = await tier.store.get(key);
      this.stateOf(tier).consecutiveFailures = 0;
      return value;
    } catch (error) {
      this.recordFailure(tier, error);
      return undefined;
    }
  }

  async set(key: string, value: T): Promise<void> {
    const active = await this.activeTier();
    await Promise.all(
      this.tiers.map((tier) => {
        if (tier === active) {
          return this.run(tier, () => tier.store.set(key, value));
        }
        // A tier in cooldown is skipped on purpose: it gets cleared on recovery anyway, so paying a
        // timeout on every write to invalidate it would be pure latency.
        return this.isHealthy(tier) ? this.run(tier, () => tier.store.delete(key)) : Promise.resolve();
      })
    );
  }

  async delete(key: string): Promise<void> {
    await this.activeTier();
    await Promise.all(
      this.tiers.map((tier) =>
        this.isHealthy(tier) ? this.run(tier, () => tier.store.delete(key)) : Promise.resolve()
      )
    );
  }

  /**
   * First tier usable right now, in declaration order. Probes and clears recovered tiers on the way,
   * so a tier that comes back up is never read from before it is clean.
   */
  private async activeTier(): Promise<CacheTier<T> | undefined> {
    for (const tier of this.tiers) {
      const state = this.stateOf(tier);
      if (state.unhealthyUntil === null) {
        return tier;
      }
      if (Date.now() < state.unhealthyUntil) {
        continue;
      }
      // `clear` doubles as the connectivity probe and as the wipe of data that went stale while the
      // tier was missing invalidations.
      try {
        await tier.store.clear();
        this.logger.log(`cache tier "${tier.name}" recovered, its namespace was cleared`);
        state.consecutiveFailures = 0;
        state.unhealthyUntil = null;
        return tier;
      } catch (error) {
        this.recordFailure(tier, error);
      }
    }
    return undefined;
  }

  private async run(tier: CacheTier<T>, operation: () => Promise<unknown>): Promise<void> {
    try {
      await operation();
      this.stateOf(tier).consecutiveFailures = 0;
    } catch (error) {
      this.recordFailure(tier, error);
    }
  }

  private isHealthy(tier: CacheTier<T>): boolean {
    return this.stateOf(tier).unhealthyUntil === null;
  }

  private recordFailure(tier: CacheTier<T>, error: unknown): void {
    const state = this.stateOf(tier);
    state.consecutiveFailures++;
    if (state.unhealthyUntil !== null) {
      state.unhealthyUntil = Date.now() + PROBE_INTERVAL_MS;
      return;
    }
    if (state.consecutiveFailures >= FAILURE_THRESHOLD) {
      state.unhealthyUntil = Date.now() + PROBE_INTERVAL_MS;
      this.logger.warn(
        `cache tier "${tier.name}" failed ${state.consecutiveFailures} times in a row, taking it out of rotation for ${PROBE_INTERVAL_MS}ms`,
        error
      );
    }
  }

  private stateOf(tier: CacheTier<T>): TierState {
    const state = this.states.get(tier.name);
    if (!state) {
      throw new Error(`no state for cache tier "${tier.name}", it was not declared at construction`);
    }
    return state;
  }
}

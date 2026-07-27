import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheStore, CacheTier, FAILURE_THRESHOLD, PROBE_INTERVAL_MS, ResilientCache } from './resilient-cache';

class FakeStore implements CacheStore<string> {
  readonly entries = new Map<string, string>();
  /** When true every operation rejects, as a real backend would while it is unreachable. */
  down = false;
  readonly calls: string[] = [];

  async get(key: string): Promise<string | undefined> {
    this.record('get');
    return this.entries.get(key);
  }

  async set(key: string, value: string): Promise<unknown> {
    this.record('set');
    return this.entries.set(key, value);
  }

  async delete(key: string): Promise<unknown> {
    this.record('delete');
    return this.entries.delete(key);
  }

  async clear(): Promise<unknown> {
    this.record('clear');
    this.entries.clear();
    return undefined;
  }

  private record(operation: string): void {
    this.calls.push(operation);
    if (this.down) {
      throw new Error(`backend is down, cannot ${operation}`);
    }
  }
}

describe('ResilientCache', () => {
  let primary: FakeStore;
  let fallback: FakeStore;
  let cache: ResilientCache<string>;

  const knockOutPrimary = async (): Promise<void> => {
    primary.down = true;
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await cache.get('any-key');
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    primary = new FakeStore();
    fallback = new FakeStore();
    const tiers: CacheTier<string>[] = [
      { name: 'primary', store: primary },
      { name: 'fallback', store: fallback },
    ];
    cache = new ResilientCache(tiers);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects duplicate tier names', () => {
    expect(
      () =>
        new ResilientCache([
          { name: 'same', store: new FakeStore() },
          { name: 'same', store: new FakeStore() },
        ])
    ).toThrow(/duplicate cache tier name/);
  });

  it('serves reads and writes from the primary while it is healthy', async () => {
    await cache.set('session-1', 'tavern');

    expect(primary.entries.get('session-1')).toBe('tavern');
    await expect(cache.get('session-1')).resolves.toBe('tavern');
  });

  it('invalidates the dormant fallback on write instead of populating it', async () => {
    fallback.entries.set('session-1', 'stale');

    await cache.set('session-1', 'tavern');

    expect(primary.entries.get('session-1')).toBe('tavern');
    expect(fallback.entries.has('session-1')).toBe(false);
  });

  it('does not cascade to the fallback on a plain miss', async () => {
    fallback.entries.set('session-1', 'stale');

    await expect(cache.get('session-1')).resolves.toBeUndefined();
    expect(fallback.calls).not.toContain('get');
  });

  it('moves to the fallback after the primary fails repeatedly, with the same read-through logic', async () => {
    await knockOutPrimary();

    await cache.set('session-1', 'tavern');

    expect(fallback.entries.get('session-1')).toBe('tavern');
    await expect(cache.get('session-1')).resolves.toBe('tavern');
  });

  it('stops calling the primary while it is in cooldown', async () => {
    await knockOutPrimary();
    const callsWhenKnockedOut = primary.calls.length;

    await cache.get('session-1');
    await cache.set('session-1', 'tavern');

    expect(primary.calls.length).toBe(callsWhenKnockedOut);
  });

  it('clears the recovered primary before serving anything from it', async () => {
    primary.entries.set('session-1', 'stale-from-before-the-outage');
    await knockOutPrimary();
    primary.down = false;

    vi.advanceTimersByTime(PROBE_INTERVAL_MS);
    const value = await cache.get('session-1');

    expect(value).toBeUndefined();
    expect(primary.entries.size).toBe(0);
    expect(primary.calls).toContain('clear');
  });

  it('keeps the primary out of rotation when the recovery probe fails', async () => {
    await knockOutPrimary();

    vi.advanceTimersByTime(PROBE_INTERVAL_MS);
    await cache.set('session-1', 'tavern');

    expect(fallback.entries.get('session-1')).toBe('tavern');
    expect(primary.entries.size).toBe(0);
  });

  it('degrades to no cache at all when every tier is down', async () => {
    await knockOutPrimary();
    fallback.down = true;
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      await cache.get('any-key');
    }
    const callsWhenAllDown = primary.calls.length + fallback.calls.length;

    await expect(cache.set('session-1', 'tavern')).resolves.toBeUndefined();
    await expect(cache.get('session-1')).resolves.toBeUndefined();
    expect(primary.calls.length + fallback.calls.length).toBe(callsWhenAllDown);
  });

  it('does not take a tier out of rotation for failures that are not consecutive', async () => {
    for (let i = 0; i < FAILURE_THRESHOLD * 2; i++) {
      primary.down = true;
      await cache.get('session-1');
      primary.down = false;
      await cache.get('session-1');
    }

    await cache.set('session-1', 'tavern');
    expect(primary.entries.get('session-1')).toBe('tavern');
  });

  it('deletes the key from every healthy tier', async () => {
    primary.entries.set('session-1', 'tavern');
    fallback.entries.set('session-1', 'stale');

    await cache.delete('session-1');

    expect(primary.entries.has('session-1')).toBe(false);
    expect(fallback.entries.has('session-1')).toBe(false);
  });

  it('behaves like a plain cache when a single tier is configured', async () => {
    const only = new FakeStore();
    const single = new ResilientCache<string>([{ name: 'in-memory', store: only }]);

    await single.set('session-1', 'tavern');

    await expect(single.get('session-1')).resolves.toBe('tavern');
    await expect(single.get('unknown')).resolves.toBeUndefined();
  });
});

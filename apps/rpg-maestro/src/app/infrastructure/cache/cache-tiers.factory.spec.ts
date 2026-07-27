import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import ms from 'ms';
import { createCacheTiers } from './cache-tiers.factory';
import { CacheTier } from './resilient-cache';

/** The store a tier was built with, as the concrete types the assertions need. */
const storesOf = (tier: CacheTier<string>): { keyv: Keyv<string>; redis: KeyvRedis<unknown> } => {
  const keyv = tier.store as Keyv<string>;
  return { keyv, redis: keyv.store as KeyvRedis<unknown> };
};

describe('createCacheTiers', () => {
  const NAMESPACE = 'rpg_maestro_sessions';
  const TTL = ms('1 day');

  beforeEach(() => {
    delete process.env.CACHE_REDIS_URL;
    delete process.env.CACHE_FALLBACK_REDIS_URL;
  });

  afterEach(() => {
    delete process.env.CACHE_REDIS_URL;
    delete process.env.CACHE_FALLBACK_REDIS_URL;
  });

  it('caches in-process when no backend is configured', () => {
    const tiers = createCacheTiers<string>(NAMESPACE, TTL);

    expect(tiers.map((tier) => tier.name)).toEqual(['in-memory']);
  });

  it('declares the primary before the fallback', () => {
    process.env.CACHE_REDIS_URL = 'redis://localhost:6399';
    process.env.CACHE_FALLBACK_REDIS_URL = 'rediss://localhost:6400';

    const tiers = createCacheTiers<string>(NAMESPACE, TTL);

    expect(tiers.map((tier) => tier.name)).toEqual(['redis', 'redis-fallback']);
  });

  it('uses the fallback alone when only it is configured', () => {
    process.env.CACHE_FALLBACK_REDIS_URL = 'rediss://localhost:6400';

    const tiers = createCacheTiers<string>(NAMESPACE, TTL);

    expect(tiers.map((tier) => tier.name)).toEqual(['redis-fallback']);
  });

  it('gives the namespace to the redis store, so clearing a recovered tier cannot FLUSHDB', () => {
    process.env.CACHE_REDIS_URL = 'redis://localhost:6399';

    const { redis } = storesOf(createCacheTiers<string>(NAMESPACE, TTL)[0]);

    // KeyvRedis.clear() scans `<namespace>::*` when it has a namespace and FLUSHDB's when it has
    // none, and ResilientCache clears a tier on every recovery.
    expect(redis.namespace).toBe(NAMESPACE);
  });

  it('prefixes stored keys with the namespace exactly once', () => {
    process.env.CACHE_REDIS_URL = 'redis://localhost:6399';

    const { keyv, redis } = storesOf(createCacheTiers<string>(NAMESPACE, TTL)[0]);

    // Keyv leaves the key untouched, so the only prefix is the one KeyvRedis applies. Without this
    // the stored key would be `rpg_maestro_sessions::rpg_maestro_sessions:Kj2Yh`.
    expect(keyv.useKeyPrefix).toBe(false);
    expect(redis.createKeyPrefix('Kj2Yh', redis.namespace)).toBe('rpg_maestro_sessions::Kj2Yh');
  });

  it('keeps namespaces apart so one tier recovery cannot clear another cache', () => {
    process.env.CACHE_REDIS_URL = 'redis://localhost:6399';

    const sessions = storesOf(createCacheTiers<string>('rpg_maestro_sessions', TTL)[0]);
    const users = storesOf(createCacheTiers<string>('rpg_maestro_users', TTL)[0]);

    expect(sessions.redis.namespace).not.toBe(users.redis.namespace);
  });
});

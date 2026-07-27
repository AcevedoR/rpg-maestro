import { Logger } from '@nestjs/common';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheTier } from './resilient-cache';

const logger = new Logger('CacheTiers');

/**
 * Cache backends in priority order, from the environment:
 * - `CACHE_REDIS_URL` — the self-hosted Redis, primary;
 * - `CACHE_FALLBACK_REDIS_URL` — the managed Redis-compatible service, used with the exact same
 *   read-through logic while the primary is unreachable.
 *
 * With neither set the cache stays in-process, which is what local dev and the e2e tests want.
 */
export function createCacheTiers<T>(namespace: string, ttl: number): CacheTier<T>[] {
  const tiers: CacheTier<T>[] = [];

  const primaryUrl = process.env.CACHE_REDIS_URL;
  if (primaryUrl) {
    tiers.push({ name: 'redis', store: redisStore<T>('redis', primaryUrl, namespace, ttl) });
  }

  const fallbackUrl = process.env.CACHE_FALLBACK_REDIS_URL;
  if (fallbackUrl) {
    tiers.push({ name: 'redis-fallback', store: redisStore<T>('redis-fallback', fallbackUrl, namespace, ttl) });
  }

  if (tiers.length === 0) {
    logger.log(`no cache backend configured, "${namespace}" is cached in-process`);
    tiers.push({ name: 'in-memory', store: new Keyv<T>({ namespace, ttl }) });
  }

  return tiers;
}

function redisStore<T>(name: string, url: string, namespace: string, ttl: number): Keyv<T> {
  logger.log(`using "${name}" as a cache backend for "${namespace}"`);
  const store = new Keyv<T>({ store: new KeyvRedis(url), namespace, ttl });
  // Keyv surfaces connection problems as 'error' events; without a listener node would crash the
  // process. ResilientCache reacts to rejected operations, so logging is all that is needed here.
  store.on('error', (error) => logger.warn(`cache tier "${name}" emitted an error`, error));
  return store;
}

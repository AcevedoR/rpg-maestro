import { Logger } from '@nestjs/common';
import { createClient } from '@redis/client';

const logger = new Logger('Redis');

/**
 * The Redis every instance of the app shares, or `null` when there is none — local dev and the e2e
 * tests run a single instance, where the local clock and an in-process event bus are already
 * consistent.
 *
 * The primary is preferred and the managed fallback is used when it is the only one configured, which
 * mirrors the priority order of the cache tiers (`infrastructure/cache/cache-tiers.factory.ts`).
 * Unlike the cache this does not fail over between the two at runtime: both the clock and the event
 * fanout only work if *every* instance picked the same one, and instances cannot agree on a switch.
 */
export function sharedRedisUrl(): string | null {
  return process.env.CACHE_REDIS_URL ?? process.env.CACHE_FALLBACK_REDIS_URL ?? null;
}

/**
 * A client that is not connected yet. Callers connect it themselves, so that a Redis that is down at
 * boot delays the feature that needs it rather than the whole app.
 *
 * The 'error' listener is not optional: node-redis emits connection failures as events, and an
 * unhandled 'error' event takes the process down.
 */
export function createRedisConnection(url: string, name: string) {
  const client = createClient({ url });
  client.on('error', (error) => logger.warn(`redis connection "${name}" emitted an error`, error));
  return client;
}

/**
 * Inferred from the factory rather than spelled out: `RedisClientType`'s generics default to a RESP 2
 * client, which is not what `createClient` returns, and naming the mismatch is not worth the noise.
 */
export type RedisConnection = ReturnType<typeof createRedisConnection>;

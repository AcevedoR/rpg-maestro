import { vi } from 'vitest';
import { SessionStreamsRegistry } from './session-streams.registry';
import { InProcessSessionListenersPresence } from './session-listeners-presence';
import {
  LISTENERS_PRESENCE_KEY_PREFIX,
  LISTENERS_PRESENCE_TTL_S,
  RedisSessionListenersPresence,
} from './redis-session-listeners-presence';
import { RedisConnection } from '../infrastructure/redis/redis-connection';

interface FakeRedis {
  isReady: boolean;
  isOpen: boolean;
  connect: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  scanIterator: (options?: unknown) => AsyncGenerator<string[]>;
}

function fakeRedis(reportsByKey: Record<string, string> = {}): FakeRedis {
  return {
    isReady: true,
    isOpen: true,
    connect: vi.fn(),
    set: vi.fn(),
    get: vi.fn(async (key: string) => reportsByKey[key] ?? null),
    del: vi.fn(),
    close: vi.fn(),
    scanIterator: async function* () {
      const keys = Object.keys(reportsByKey);
      if (keys.length > 0) {
        yield keys;
      }
    },
  };
}

function presenceWith(redis: FakeRedis, registry = new SessionStreamsRegistry()): RedisSessionListenersPresence {
  return new RedisSessionListenersPresence(
    'redis://unused-in-tests',
    registry,
    'instance-under-test',
    redis as unknown as RedisConnection
  );
}

describe('InProcessSessionListenersPresence', () => {
  it('reports the local registry counts', async () => {
    const registry = new SessionStreamsRegistry();
    const presence = new InProcessSessionListenersPresence(registry);

    registry.opened('session-a');
    registry.opened('session-a');

    await expect(presence.countsBySession()).resolves.toEqual({ 'session-a': 2 });
  });
});

describe('RedisSessionListenersPresence', () => {
  it('reports its own counts under its own key when a stream opens', async () => {
    const redis = fakeRedis();
    const registry = new SessionStreamsRegistry();
    const presence = presenceWith(redis, registry);

    registry.opened('session-a');

    await vi.waitFor(() =>
      expect(redis.set).toHaveBeenCalledWith(
        `${LISTENERS_PRESENCE_KEY_PREFIX}instance-under-test`,
        JSON.stringify({ 'session-a': 1 }),
        { expiration: { type: 'EX', value: LISTENERS_PRESENCE_TTL_S } }
      )
    );
    await presence.close();
  });

  it('removes its own key when its last stream closes', async () => {
    const redis = fakeRedis();
    const registry = new SessionStreamsRegistry();
    const presence = presenceWith(redis, registry);

    registry.opened('session-a');
    registry.closed('session-a');

    await vi.waitFor(() => expect(redis.del).toHaveBeenCalledWith(`${LISTENERS_PRESENCE_KEY_PREFIX}instance-under-test`));
    await presence.close();
  });

  it('sums the reports of every instance', async () => {
    const redis = fakeRedis({
      [`${LISTENERS_PRESENCE_KEY_PREFIX}instance-1`]: JSON.stringify({ 'session-a': 2, 'session-b': 1 }),
      [`${LISTENERS_PRESENCE_KEY_PREFIX}instance-2`]: JSON.stringify({ 'session-a': 3 }),
    });
    const presence = presenceWith(redis);

    await expect(presence.countsBySession()).resolves.toEqual({ 'session-a': 5, 'session-b': 1 });
    await presence.close();
  });

  it('drops an unparseable report but keeps the others', async () => {
    const redis = fakeRedis({
      [`${LISTENERS_PRESENCE_KEY_PREFIX}instance-1`]: 'not json',
      [`${LISTENERS_PRESENCE_KEY_PREFIX}instance-2`]: JSON.stringify({ 'session-a': 3 }),
    });
    const presence = presenceWith(redis);

    await expect(presence.countsBySession()).resolves.toEqual({ 'session-a': 3 });
    await presence.close();
  });

  it('falls back to its own local counts when redis cannot be read', async () => {
    const redis = fakeRedis();
    redis.scanIterator = async function* (): AsyncGenerator<string[]> {
      throw new Error('redis is down');
      yield [];
    };
    const registry = new SessionStreamsRegistry();
    const presence = presenceWith(redis, registry);
    registry.opened('session-a');

    await expect(presence.countsBySession()).resolves.toEqual({ 'session-a': 1 });
    await presence.close();
  });

  it('removes its own key and closes the connection on shutdown', async () => {
    const redis = fakeRedis();
    const presence = presenceWith(redis);

    await presence.close();

    expect(redis.del).toHaveBeenCalledWith(`${LISTENERS_PRESENCE_KEY_PREFIX}instance-under-test`);
    expect(redis.close).toHaveBeenCalled();
  });
});

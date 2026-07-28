import { Logger } from '@nestjs/common';
import { createRedisConnection, RedisConnection } from '../redis/redis-connection';
import { TimeReference } from './time-reference';

/**
 * Redis' own clock, read with `TIME`, as the instant every instance agrees on.
 *
 * Redis is already the one piece of infrastructure all instances share, which is what makes it a
 * usable reference: it is a single clock, reachable in a millisecond or two, and it does not need a
 * write to be read — unlike a database server timestamp, which would cost a round trip *and* a write
 * on every track change.
 */
export class RedisTimeReference implements TimeReference {
  readonly name = 'redis';
  private readonly logger = new Logger(RedisTimeReference.name);
  private readonly client: RedisConnection;
  private connecting: Promise<void> | null = null;

  constructor(url: string) {
    this.client = createRedisConnection(url, this.name);
  }

  async read(): Promise<number> {
    await this.connect();
    const [seconds, microseconds] = await this.client.time();
    return Number(seconds) * 1000 + Number(microseconds) / 1000;
  }

  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  /**
   * Connects on first use, and lets a failed attempt be retried by the next one: the clock resyncs
   * on a loop, so a Redis that is down at boot only costs the accuracy of the offset until it is back.
   */
  private async connect(): Promise<void> {
    if (this.client.isReady) {
      return;
    }
    if (!this.connecting) {
      this.connecting = this.client
        .connect()
        .then(() => {
          this.logger.log('connected to the redis time reference');
        })
        .finally(() => {
          this.connecting = null;
        });
    }
    await this.connecting;
  }
}

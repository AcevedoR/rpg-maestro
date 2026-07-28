import { Global, Logger, Module } from '@nestjs/common';
import { sharedRedisUrl } from '../redis/redis-connection';
import { RedisTimeReference } from './redis-time-reference';
import { ServerClock, TIME_REFERENCE } from './server-clock';
import { TimeReference } from './time-reference';

const logger = new Logger('ClockModule');

export function createTimeReference(): TimeReference | null {
  const url = sharedRedisUrl();
  if (!url) {
    logger.log('no shared redis configured, the local clock is the playback time authority');
    return null;
  }
  return new RedisTimeReference(url);
}

/**
 * Global on purpose: every write path that stamps a playback timestamp needs the same clock, and
 * threading it through each module that happens to build a `ManageCurrentlyPlayingTracks` would
 * only spread the wiring without adding a decision anywhere.
 */
@Global()
@Module({
  providers: [ServerClock, { provide: TIME_REFERENCE, useFactory: createTimeReference }],
  exports: [ServerClock],
})
export class ClockModule {}

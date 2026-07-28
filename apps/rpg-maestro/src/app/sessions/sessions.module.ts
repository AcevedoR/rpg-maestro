import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { SessionsService } from './sessions.service';
import { SESSION_EVENTS_BROKER, SessionEventsService } from './session-events.service';
import { InProcessSessionEventsBroker, SessionEventsBroker } from './session-events.broker';
import { RedisSessionEventsBroker } from './redis-session-events.broker';
import { sharedRedisUrl } from '../infrastructure/redis/redis-connection';
import { SessionStreamsRegistry } from './session-streams.registry';

const logger = new Logger('SessionModule');

export function createSessionEventsBroker(): SessionEventsBroker {
  const url = sharedRedisUrl();
  if (!url) {
    return new InProcessSessionEventsBroker();
  }
  logger.log('session events fan out over redis pub/sub');
  return new RedisSessionEventsBroker(url);
}

@Module({
  imports: [DatabaseModule],
  providers: [
    SessionsService,
    SessionEventsService,
    SessionStreamsRegistry,
    { provide: SESSION_EVENTS_BROKER, useFactory: createSessionEventsBroker },
  ],
  exports: [SessionsService, SessionEventsService, SessionStreamsRegistry],
})
export class SessionModule {}

import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database.module';
import { SessionsService } from './sessions.service';
import { SESSION_EVENTS_BROKER, SessionEventsService } from './session-events.service';
import { InProcessSessionEventsBroker, SessionEventsBroker } from './session-events.broker';
import { RedisSessionEventsBroker } from './redis-session-events.broker';
import { sharedRedisUrl } from '../infrastructure/redis/redis-connection';
import { SessionStreamsRegistry } from './session-streams.registry';
import {
  InProcessSessionListenersPresence,
  SESSION_LISTENERS_PRESENCE,
  SessionListenersPresence,
} from './session-listeners-presence';
import { RedisSessionListenersPresence } from './redis-session-listeners-presence';

const logger = new Logger('SessionModule');

export function createSessionEventsBroker(): SessionEventsBroker {
  const url = sharedRedisUrl();
  if (!url) {
    return new InProcessSessionEventsBroker();
  }
  logger.log('session events fan out over redis pub/sub');
  return new RedisSessionEventsBroker(url);
}

export function createSessionListenersPresence(registry: SessionStreamsRegistry): SessionListenersPresence {
  const url = sharedRedisUrl();
  if (!url) {
    return new InProcessSessionListenersPresence(registry);
  }
  logger.log('listener presence is tracked in redis across instances');
  return new RedisSessionListenersPresence(url, registry);
}

@Module({
  imports: [DatabaseModule],
  providers: [
    SessionsService,
    SessionEventsService,
    SessionStreamsRegistry,
    { provide: SESSION_EVENTS_BROKER, useFactory: createSessionEventsBroker },
    {
      provide: SESSION_LISTENERS_PRESENCE,
      useFactory: createSessionListenersPresence,
      inject: [SessionStreamsRegistry],
    },
  ],
  exports: [SessionsService, SessionEventsService, SessionStreamsRegistry, SESSION_LISTENERS_PRESENCE],
})
export class SessionModule {}

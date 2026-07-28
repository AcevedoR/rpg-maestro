import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Inject,
  MessageEvent,
  Param,
  Sse,
} from '@nestjs/common';
import { concat, defer, finalize, interval, map, merge, Observable, of } from 'rxjs';
import { ServerTime, SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionsService } from './sessions/sessions.service';
import { TrackService } from './maestro-api/TrackService';
import { SessionEventsService } from './sessions/session-events.service';
import { ServerClock } from './infrastructure/clock/server-clock';
import { SessionStreamsRegistry } from './sessions/session-streams.registry';

/**
 * Keeps an idle stream from being dropped by whatever sits between the browser and the app: an SSE
 * connection that says nothing for minutes looks dead to a proxy, and a track can easily play that
 * long without changing.
 */
export const STREAM_HEARTBEAT_INTERVAL_MS = 20_000;

/** Named events, so a client's track handler is not woken up by heartbeats. */
export const PLAYING_TRACKS_EVENT = 'playing-tracks';
export const HEARTBEAT_EVENT = 'heartbeat';

@Controller()
export class PlayersController {
  constructor(
    @Inject(SessionsService) private sessionsService: SessionsService,
    @Inject(TrackService) private trackService: TrackService,
    @Inject(SessionEventsService) private sessionEvents: SessionEventsService,
    @Inject(ServerClock) private serverClock: ServerClock,
    @Inject(SessionStreamsRegistry) private streams: SessionStreamsRegistry
  ) {}

  @Get('/migrate')
  async migrate(): Promise<string> {
    await this.trackService.migrateTracksTmp();
    return 'done';
  }
  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.trackService.get(id);
  }

  /**
   * The clock `PlayingTrack.playTimestamp` is expressed in. Clients measure their own offset against
   * it instead of assuming their `Date.now()` agrees with it, which it usually does not.
   *
   * `no-store` is load-bearing: a CDN or reverse proxy that cached this would hand every client behind
   * it the same frozen timestamp, and each would compute an offset off by however long the entry had
   * been sitting there — turning the fix for clock skew into a source of it.
   */
  @Get('/server-time')
  @Header('Cache-Control', 'no-store')
  getServerTime(): ServerTime {
    return { serverTime: this.serverClock.now() };
  }

  @Get('/sessions/:id/playing-tracks')
  async getSessionTracks(@Param('id') sessionId: string): Promise<SessionPlayingTracks> {
    const dbValue = await this.sessionsService.getSessionPlayingTracks(sessionId);
    if (!dbValue) {
      throw new HttpException(`Session '${sessionId}' not found`, HttpStatus.NOT_FOUND);
    }
    return dbValue;
  }

  /**
   * Pushes this session's playing tracks as they change, so listeners do not have to poll for them.
   *
   * SSE rather than a WebSocket: everything here flows server→client, so a duplex protocol would buy
   * nothing, and a plain GET needs no sticky sessions — any instance can serve any listener, given the
   * pub/sub fanout behind {@link SessionEventsService}.
   *
   * The stream opens with the current state, so a client needs no separate fetch to get started.
   */
  @Sse('/sessions/:id/playing-tracks/stream')
  async streamSessionTracks(@Param('id') sessionId: string): Promise<Observable<MessageEvent>> {
    const session = await this.sessionsService.getSessionPlayingTracks(sessionId);
    if (!session) {
      // Reported before the stream opens, so the client gets a 404 instead of an empty stream it would
      // reconnect to forever.
      throw new HttpException(`Session '${sessionId}' not found`, HttpStatus.NOT_FOUND);
    }
    const snapshotThenChanges: Observable<MessageEvent> = concat(
      of(session),
      this.sessionEvents.observe(sessionId)
    ).pipe(map((tracks) => ({ data: tracks, type: PLAYING_TRACKS_EVENT })));
    const heartbeats: Observable<MessageEvent> = interval(STREAM_HEARTBEAT_INTERVAL_MS).pipe(
      map(() => ({ data: {}, type: HEARTBEAT_EVENT }))
    );
    // `defer` so the stream is counted when it is actually subscribed to, and `finalize` so it is
    // uncounted however it ends — client navigating away, proxy timeout, or shutdown.
    return defer(() => {
      this.streams.opened(sessionId);
      return merge(snapshotThenChanges, heartbeats);
    }).pipe(finalize(() => this.streams.closed(sessionId)));
  }
}

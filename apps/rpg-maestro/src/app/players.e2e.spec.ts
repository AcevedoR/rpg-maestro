process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3017';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';
process.env.LOG_LEVEL = 'WARN';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PlayingTrack, ServerTime, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { TestUsersFixture } from '@rpg-maestro/test-utils';
import { SessionsService } from './sessions/sessions.service';

const BASE_URL = 'http://localhost:3017';

describe('Players API', () => {
  let app: INestApplication;
  let sessionId: string;

  beforeAll(async () => {
    process.env.AUTH_ISSUER = `${BASE_URL}/test-utils/fake-idp`;
    process.env.AUTH_JWT_AUDIENCE = BASE_URL;
    const { bootstrap } = await import('./../app-bootstrap');
    app = await bootstrap();
    const users = await request(app.getHttpServer())
      .post('/test-utils/create-test-users-fixtures')
      .expect(201)
      .then((httpResponse) => httpResponse.body as TestUsersFixture);
    const session = await request(app.getHttpServer())
      .post('/maestro/sessions')
      .set('Authorization', `Bearer ${users.a_maestro_user.token}`)
      .send({})
      .then((httpResponse) => httpResponse.body as SessionPlayingTracks);
    sessionId = session.sessionId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /server-time answers with the clock playback timestamps are stamped in, uncacheably', async () => {
    const before = Date.now();
    const { serverTime } = await request(app.getHttpServer())
      .get('/server-time')
      .expect(200)
      // A cached timestamp would hand everyone behind that cache the same stale instant, so every one
      // of them would measure an offset off by however long the entry had been sitting there.
      .expect('Cache-Control', 'no-store')
      .then((httpResponse) => httpResponse.body as ServerTime);

    expect(serverTime).toBeGreaterThanOrEqual(before - 1000);
    expect(serverTime).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('the playing-tracks stream opens with the current state and then pushes every change', async () => {
    const stream = await openStream(`${BASE_URL}/sessions/${sessionId}/playing-tracks/stream`);
    try {
      const snapshot = await stream.nextEvent();
      expect(snapshot.type).toBe('playing-tracks');
      expect((snapshot.data as SessionPlayingTracks).sessionId).toBe(sessionId);
      expect((snapshot.data as SessionPlayingTracks).currentTrack).toBeFalsy();

      // Through the service the Maestro's write path goes through, so this covers the publish that
      // happens on a real track change without needing an uploaded audio file.
      await app
        .get(SessionsService)
        .upsertCurrentTrack(
          sessionId,
          new PlayingTrack('track-1', 'a-pushed-track', 'http://localhost/track.mp3', 120000, false, Date.now(), 0)
        );

      const pushed = await stream.nextEvent();
      expect(pushed.type).toBe('playing-tracks');
      expect((pushed.data as SessionPlayingTracks).currentTrack?.name).toBe('a-pushed-track');
    } finally {
      await stream.close();
    }
  }, 10000);

  it('reports its open streams on /health, since a stream holds a connection for as long as a listener stays', async () => {
    const openStreams = async (): Promise<number> => {
      const body = await request(app.getHttpServer())
        .get('/health')
        .then((httpResponse) => httpResponse.body as { details: { playback: { openStreams: number } } });
      return body.details.playback.openStreams;
    };
    expect(await openStreams()).toBe(0);

    const stream = await openStream(`${BASE_URL}/sessions/${sessionId}/playing-tracks/stream`);
    await stream.nextEvent();
    expect(await openStreams()).toBe(1);

    await stream.close();
    // the count comes back down however the stream ended, here a client hanging up
    await expect.poll(() => openStreams()).toBe(0);
  }, 10000);

  it('a stream for a session that does not exist is refused, instead of hanging open', async () => {
    // The client can then stop retrying, rather than reconnecting forever to a stream that will never
    // say anything.
    await request(app.getHttpServer()).get('/sessions/no-such-session/playing-tracks/stream').expect(404);
  });
});

interface ServerSentEvent {
  type: string;
  data: unknown;
}

/**
 * Minimal SSE client: supertest buffers a response until it ends, which a stream never does, so this
 * reads the body as it arrives and hands out one parsed event at a time.
 */
async function openStream(url: string): Promise<{ nextEvent: () => Promise<ServerSentEvent>; close: () => Promise<void> }> {
  const abort = new AbortController();
  const response = await fetch(url, { headers: { Accept: 'text/event-stream' }, signal: abort.signal });
  if (!response.ok || !response.body) {
    throw new Error(`could not open the stream: ${response.status}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = '';

  const nextEvent = async (): Promise<ServerSentEvent> => {
    for (;;) {
      const separator = buffered.indexOf('\n\n');
      if (separator >= 0) {
        const raw = buffered.slice(0, separator);
        buffered = buffered.slice(separator + 2);
        const event = parseEvent(raw);
        if (event) {
          return event;
        }
        continue;
      }
      const { done, value } = await reader.read();
      if (done) {
        throw new Error('the stream ended before the expected event');
      }
      buffered += decoder.decode(value, { stream: true });
    }
  };

  return {
    nextEvent,
    close: async () => {
      abort.abort();
      await reader.cancel().catch(() => undefined);
    },
  };
}

function parseEvent(raw: string): ServerSentEvent | null {
  const lines = raw.split('\n');
  const type = lines.find((line) => line.startsWith('event:'))?.slice('event:'.length).trim();
  const data = lines.find((line) => line.startsWith('data:'))?.slice('data:'.length).trim();
  if (!type || !data) {
    return null;
  }
  return { type, data: JSON.parse(data) };
}

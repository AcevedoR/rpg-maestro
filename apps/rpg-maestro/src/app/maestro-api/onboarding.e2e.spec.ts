process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3012';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';
process.env.LOG_LEVEL = 'DEBUG';
// keep env var first

import { FakeJwtToken } from '@rpg-maestro/test-utils';
import express, { Express } from 'express';
import {
  CreateSession,
  parseAndValidateDto,
  SessionPlayingTracks,
  Track,
  TrackCollectionCreation
} from '@rpg-maestro/rpg-maestro-api-contract';
import { bootstrap } from '../../app-bootstrap';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import path from 'node:path';
import http from 'http';
import { TestUsersFixture } from '../test-utils/tests-utils.controller';

const staticServerPort = 3014;

describe('Onboarding API e2e', () => {
  let app: INestApplication;
  let staticServer: http.Server;
  const staticServerApp: Express = express();

  let AN_ADMIN_USER: FakeJwtToken;
  let A_MAESTRO_USER: FakeJwtToken;
  let A_MINSTREL_USER: FakeJwtToken;

  const EMPTY_SESSION_BODY = {};

  beforeAll(async () => {
    staticServerApp.use('/public', express.static(path.join(__dirname, '../../assets')));
    staticServer = staticServerApp.listen(staticServerPort, () => {
      console.info(`[server]: Server serving static files is running at http://localhost:${staticServerPort}`);
    });
  });
  beforeEach(async () => {
    app = await bootstrap();
    const users = await request(app.getHttpServer())
      .post('/test-utils/create-test-users-fixtures')
      .expect(201)
      .then((httpResponse) => httpResponse.body as TestUsersFixture);
    A_MAESTRO_USER = users.a_maestro_user;
    A_MINSTREL_USER = users.a_minstrel_user;
    AN_ADMIN_USER = users.an_admin_user;
  });

  it('an Maestro can create a session', async () => {
    const created = (
      await request(app.getHttpServer())
        .post('/maestro/sessions')
        .send(EMPTY_SESSION_BODY)
        .set('Content-Type', 'application/json')
        .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
        .expect(201)
    ).body as SessionPlayingTracks;

    expect(created.sessionId).toBeDefined();
    expect(created.sessionId.length).toBeGreaterThan(1);

    const fetched = (
      await request(app.getHttpServer())
        .get('/sessions/:sessionId/playing-tracks'.replace(':sessionId', created.sessionId))
        .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
        .expect(200)
    ).body as SessionPlayingTracks;
    expect(fetched.sessionId).toEqual(created.sessionId);
  });

  it('a Minstrel cannot create a new session outside of onboarding process', async () => {
    await request(app.getHttpServer())
      .post('/maestro/sessions')
      .send(EMPTY_SESSION_BODY)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${A_MINSTREL_USER.token}`)
      .expect(403)
  });

  it('a Maestro can create a session with a default collection', async () => {
    const trackCollectionCreateRequest: TrackCollectionCreation = {
      id: 'test-collection',
      name: 'Test Collection',
      description: 'A collection for testing purposes',
      tracks: [
        {
          url: 'http://localhost:'+staticServerPort+'/public/light-switch-sound-198508.mp3',
          name: 'Track 1',
          tags: ['tag1', 'tag2'],
          source: {
            origin_media: "same-server",
            origin_name: "origin name",
            origin_url: 'http://localhost:'+staticServerPort+'/public/light-switch-sound-198508.mp3'
          }
        },
      ],
    };
    await request(app.getHttpServer())
      .put('/track-collections/default')
      .send(trackCollectionCreateRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(200);

    const createSessionRequest: CreateSession = await parseAndValidateDto(CreateSession, {
      withTrackCollections: [trackCollectionCreateRequest.id]
    });

    const created = (
      await request(app.getHttpServer())
        .post('/maestro/sessions')
        .send(createSessionRequest)
        .set('Content-Type', 'application/json')
        .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
        .expect(201)
    ).body as SessionPlayingTracks;

    expect(created.sessionId).toBeDefined();
    expect(created.sessionId.length).toBeGreaterThan(1);

    const sessionTracks = (
      await request(app.getHttpServer())
        .get('/maestro/sessions/:sessionId/tracks'.replace(':sessionId', created.sessionId))
        .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
        .expect(200)
    ).body as Track[];
    expect(sessionTracks).toBeDefined();
    expect(sessionTracks.length).toEqual(trackCollectionCreateRequest.tracks.length);
    expect(sessionTracks[0].sessionId).toEqual(created.sessionId);
    expect(sessionTracks[0].url).toEqual(trackCollectionCreateRequest.tracks[0].url);
    expect(sessionTracks[0].name).toEqual(trackCollectionCreateRequest.tracks[0].name);
    expect(sessionTracks[0].tags).toEqual(trackCollectionCreateRequest.tracks[0].tags);
    expect(sessionTracks[0].source).toEqual(trackCollectionCreateRequest.tracks[0].source);

    expect(created.currentTrack).toBeDefined();
  });

  afterEach(async () => {
    await app.close();
  });
  afterAll(() => {
    staticServer.close();
  });
});

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
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
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

  afterEach(async () => {
    await app.close();
  });
  afterAll(() => {
    staticServer.close();
  });
});

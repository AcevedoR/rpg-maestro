process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3015';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';
process.env.LOG_LEVEL = 'DEBUG';
// keep env var first

import { FakeJwtToken } from '@rpg-maestro/test-utils';
import express, { Express } from 'express';
import { TrackCollection, TrackCollectionCreation } from '@rpg-maestro/rpg-maestro-api-contract';
import { bootstrap } from '../../app-bootstrap';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import path from 'node:path';
import http from 'http';
import { TestUsersFixture } from '../test-utils/tests-utils.controller';

const staticServerPort = 3013;
const createRequest: TrackCollectionCreation = {
  id: 'test-collection',
  name: 'Test Collection',
  description: 'A collection for testing purposes',
  tracks: [
    {
      url: 'http://localhost:'+staticServerPort+'/public/light-switch-sound-198508.mp3',
      name: 'Track 1',
      tags: ['tag1', 'tag2'],
    },
  ],
};

describe('TrackCollection', () => {
  let app: INestApplication;
  let staticServer: http.Server;
  const staticServerApp: Express = express();

  let AN_ADMIN_USER: FakeJwtToken;
  let A_MAESTRO_USER: FakeJwtToken;

  beforeAll(async () => {
    staticServerApp.use('/public', express.static(path.join(__dirname, '../../assets')));
    staticServer = staticServerApp.listen(staticServerPort, () => {
      console.info(`[server]: Server serving static files is running at http://localhost:${staticServerPort}`);
    });
  })
  beforeEach(async () => {
    app = await bootstrap();
    const users = await request(app.getHttpServer())
      .post('/test-utils/create-test-users-fixtures')
      .expect(201)
      .then((httpResponse) => httpResponse.body as TestUsersFixture);
    AN_ADMIN_USER = users.an_admin_user;
    A_MAESTRO_USER = users.a_maestro_user;
  });

  it('an Admin can create a TrackCollection', async () => {
    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(createRequest.id);
        expect(res.name).toEqual(createRequest.name);
        expect(res.description).toEqual(createRequest.description);
        expect(res.tracks).toBeDefined();
        expect(res.tracks.length).toEqual(1);
        expect(res.tracks[0].url).toEqual(createRequest.tracks[0].url);
        expect(res.tracks[0].name).toEqual(createRequest.tracks[0].name);
        expect(res.tracks[0].tags).toEqual(createRequest.tracks[0].tags);
      });

    await request(app.getHttpServer())
      .get('/track-collections/' + createRequest.id)
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(200)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(createRequest.id);
      });
  });
  it('a Maestro can get TrackCollections', async () => {
    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(createRequest.id);
      });

    await request(app.getHttpServer())
      .get('/track-collections/' + createRequest.id)
      .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
      .expect(200)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(createRequest.id);
      });
  });
  it('cannot create when not Admin', async () => {

    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
      .expect(403);
  });
  it('cannot create with already existing id', async () => {
    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(409)
      .then((httpResponse) => {
        expect(httpResponse.body.message).toContain('already exists');
      });
  });

  afterEach(async () => {
    await app.close();
  });
  afterAll(() => {
    staticServer.close();
  })
});

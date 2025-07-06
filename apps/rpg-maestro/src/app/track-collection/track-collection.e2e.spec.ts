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
import {
  SessionPlayingTracks, Track,
  TrackCollection,
  TrackCollectionCreation,
  TrackCollectionImportFromSession, TrackCreation
} from '@rpg-maestro/rpg-maestro-api-contract';
import { bootstrap } from '../../app-bootstrap';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import path from 'node:path';
import http from 'http';
import { TestUsersFixture } from '../test-utils/tests-utils.controller';

const staticServerPort = 3013;
export const trackCollectionCreateRequest: TrackCollectionCreation = {
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
      .send(trackCollectionCreateRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(trackCollectionCreateRequest.id);
        expect(res.name).toEqual(trackCollectionCreateRequest.name);
        expect(res.description).toEqual(trackCollectionCreateRequest.description);
        expect(res.tracks).toBeDefined();
        expect(res.tracks.length).toEqual(1);
        expect(res.tracks[0].url).toEqual(trackCollectionCreateRequest.tracks[0].url);
        expect(res.tracks[0].name).toEqual(trackCollectionCreateRequest.tracks[0].name);
        expect(res.tracks[0].tags).toEqual(trackCollectionCreateRequest.tracks[0].tags);
      });

    await request(app.getHttpServer())
      .get('/track-collections/' + trackCollectionCreateRequest.id)
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(200)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(trackCollectionCreateRequest.id);
      });
  });
  it('a Maestro can get TrackCollections', async () => {
    await request(app.getHttpServer())
      .post('/track-collections')
      .send(trackCollectionCreateRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(trackCollectionCreateRequest.id);
      });

    await request(app.getHttpServer())
      .get('/track-collections/' + trackCollectionCreateRequest.id)
      .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
      .expect(200)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(trackCollectionCreateRequest.id);
      });
  });
  it('an Admin can import a TrackCollection from an existing session', async () => {
    // given a session
    const session = (await request(app.getHttpServer())
      .post('/maestro/sessions')
      .send({})
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)).body as SessionPlayingTracks;

    const trackCreationRequest: TrackCreation = {
      url: 'http://localhost:'+staticServerPort+'/public/light-switch-sound-198508.mp3',
      name: 'Track 1 from session',
      tags: ['tag1', 'tag2'],
    }

    const createdTrack = (await request(app.getHttpServer())
      .post('/maestro/sessions/:sessionId/tracks'.replace(':sessionId', session.sessionId))
      .send(trackCreationRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)).body as Track;

    const importRequest: TrackCollectionImportFromSession = {
      sessionId: session.sessionId,
      id: 'my-new-track-collection',
      name: 'my new track collection'
    };
    await request(app.getHttpServer())
      .post('/track-collections/import-from/session')
      .send(importRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(importRequest.id);
        expect(res.name).toEqual(importRequest.name);
        expect(res.tracks).toBeDefined();
        expect(res.tracks.length).toEqual(1);
        expect(res.tracks[0].url).toEqual(createdTrack.url);
        expect(res.tracks[0].name).toEqual(createdTrack.name);
        expect(res.tracks[0].tags).toEqual(createdTrack.tags);
      });

    await request(app.getHttpServer())
      .get('/track-collections/' + importRequest.id)
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(200)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(importRequest.id);
      });
  });
  it('cannot create when not Admin', async () => {
    await request(app.getHttpServer())
      .post('/track-collections')
      .send(trackCollectionCreateRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
      .expect(403);
  });
  it('cannot create with already existing id', async () => {
    await request(app.getHttpServer())
      .post('/track-collections')
      .send(trackCollectionCreateRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/track-collections')
      .send(trackCollectionCreateRequest)
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

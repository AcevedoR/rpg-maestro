import express, { Express } from 'express';

process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3012';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';
process.env.LOG_LEVEL = 'WARN';
// keep env var first

import { FakeJwtToken } from '../test-utils/auth';
import { TrackCollection, TrackCollectionCreation } from '@rpg-maestro/rpg-maestro-api-contract';
import { bootstrap } from '../../app-bootstrap';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import path from 'node:path';
import http from 'http';

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
  beforeAll(async () => {
    staticServerApp.use('/public', express.static(path.join(__dirname, '../../assets')));
    staticServer = staticServerApp.listen(staticServerPort, () => {
      console.log(`[server]: Server serving static files is running at http://localhost:${staticServerPort}`);
    });
  })
  beforeEach(async () => {
    app = await bootstrap();
  });

  it('an Admin can create a TrackCollection', async () => {
    const adminUserToken = await getAdminToken(app);

    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${adminUserToken}`)
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
      .set('Cookie', `CF_Authorization=${adminUserToken}`)
      .expect(200)
      .then((httpResponse) => {
        const res = httpResponse.body as TrackCollection;
        expect(res.id).toEqual(createRequest.id);
      });
  });
  it('a Maestro can get TrackCollections', async () => {
    // TODO
    fail('to implement');
  });
  it('cannot create when not Admin', async () => {
    // TODO
    fail('to implement');
  });
  it('cannot create with already existing id', async () => {
    const adminUserToken = await getAdminToken(app);

    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${adminUserToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/track-collections')
      .send(createRequest)
      .set('Content-Type', 'application/json')
      .set('Cookie', `CF_Authorization=${adminUserToken}`)
      .expect(409)
      .then((httpResponse) => {
        expect(httpResponse.body.message).toContain('already exists');
      });
  });
  it('cannot create with no id in request body', async () => {
    // TODO
    fail('to implement');
  });
  it('can create without optional field description', async () => {
    // TODO
    fail('to implement');
  });

  afterEach(async () => {
    await app.close();
    staticServer.close();
  });
});
async function getAdminToken(app: INestApplication<any>) {
  const adminUserToken = await request(app.getHttpServer())
    .post('/test-utils/create-test-users-fixtures')
    .expect(201)
    .then((httpResponse) => httpResponse.body.token as FakeJwtToken);
  return adminUserToken;
}

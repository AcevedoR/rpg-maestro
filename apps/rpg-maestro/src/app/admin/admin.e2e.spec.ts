process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3016';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';
process.env.LOG_LEVEL = 'WARN';
// keep env var first

import { FakeJwtToken, TestUsersFixture } from '@rpg-maestro/test-utils';
import { bootstrap } from '../../app-bootstrap';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

describe('TrackCollection', () => {
  let app: INestApplication;

  let AN_ADMIN_USER: FakeJwtToken;
  let A_MAESTRO_USER: FakeJwtToken;

  beforeEach(async () => {
    app = await bootstrap();
    const users = await request(app.getHttpServer())
      .post('/test-utils/create-test-users-fixtures')
      .expect(201)
      .then((httpResponse) => httpResponse.body as TestUsersFixture);
    AN_ADMIN_USER = users.an_admin_user;
    A_MAESTRO_USER = users.a_maestro_user;
  });

  it('an Admin can get all sessions', async () => {
    await request(app.getHttpServer())
      .get('/maestro/admin/sessions')
      .set('Cookie', `CF_Authorization=${AN_ADMIN_USER.token}`)
      .expect(200);
  }, 10000);
  it('a Maestro is forbidden to get all sessions', async () => {
    await request(app.getHttpServer())
      .get('/maestro/admin/sessions')
      .set('Cookie', `CF_Authorization=${A_MAESTRO_USER.token}`)
      .expect(403);
  }, 10000);

  afterEach(async () => {
    await app.close();
  });
});

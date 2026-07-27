import { FakeJwtToken, TestUsersFixture } from '@rpg-maestro/test-utils';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { LandingEventsDailyCount, LandingVisitsDailyCount, UpgradeInterest } from '@rpg-maestro/rpg-maestro-api-contract';

describe('Landing API', () => {
  let app: INestApplication;

  let AN_ADMIN_USER: FakeJwtToken;
  let A_MAESTRO_USER: FakeJwtToken;

  beforeEach(async () => {
    process.env.DATABASE = 'in-memory';
    process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
    process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
    process.env.AUTH_JWT_AUDIENCE = 'http://localhost:3017';
    process.env.AUTH_ISSUER = 'http://localhost:3017/test-utils/fake-idp';
    process.env.PORT = '3017';
    process.env.NODE_ENV = 'unit-tests';
    process.env.CONFIGURATION_ENV = 'unit-tests';
    process.env.LOG_LEVEL = 'WARN';
    const { bootstrap } = await import('../../app-bootstrap');
    app = await bootstrap();
    const users = await request(app.getHttpServer())
      .post('/test-utils/create-test-users-fixtures')
      .expect(201)
      .then((httpResponse) => httpResponse.body as TestUsersFixture);
    AN_ADMIN_USER = users.an_admin_user;
    A_MAESTRO_USER = users.a_maestro_user;
  });

  it('anyone can register upgrade interest without authentication, and an Admin can read it back', async () => {
    await request(app.getHttpServer())
      .post('/upgrade-interest')
      .send({ email: 'stranger@example.com', source: 'dmacademy-post', referrer: 'https://reddit.com', had_session: true })
      .expect(201);

    const upgradeInterests = (
      await request(app.getHttpServer())
        .get('/upgrade-interest')
        .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
        .expect(200)
    ).body as UpgradeInterest[];
    expect(upgradeInterests).toHaveLength(1);
    expect(upgradeInterests[0]).toMatchObject({
      email: 'stranger@example.com',
      source: 'dmacademy-post',
      had_session: true,
    });
  }, 10000);

  it('rejects an invalid email with a 400', async () => {
    await request(app.getHttpServer()).post('/upgrade-interest').send({ email: 'not-an-email' }).expect(400);
  }, 10000);

  it('an unauthenticated user cannot list upgrade interests', async () => {
    await request(app.getHttpServer()).get('/upgrade-interest').expect(401);
  }, 10000);

  it('a Maestro is forbidden to list upgrade interests', async () => {
    await request(app.getHttpServer())
      .get('/upgrade-interest')
      .set('Authorization', `Bearer ${A_MAESTRO_USER.token}`)
      .expect(403);
  }, 10000);

  it('anyone can record funnel events, and an Admin can read daily counts per type and source', async () => {
    await request(app.getHttpServer())
      .post('/landing-events')
      .send({ type: 'start_free_clicked', source: 'dmacademy-post' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/landing-events')
      .send({ type: 'session_created', source: 'dmacademy-post' })
      .expect(201);

    const counts = (
      await request(app.getHttpServer())
        .get('/landing-events')
        .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
        .expect(200)
    ).body as LandingEventsDailyCount[];
    const byType = Object.fromEntries(counts.map((c) => [c.type, c.count]));
    expect(byType['start_free_clicked']).toBe(1);
    expect(byType['session_created']).toBe(1);
  }, 10000);

  it('rejects an unknown funnel event type with a 400', async () => {
    await request(app.getHttpServer()).post('/landing-events').send({ type: 'not-an-event' }).expect(400);
  }, 10000);

  it('a Maestro is forbidden to list funnel events', async () => {
    await request(app.getHttpServer())
      .get('/landing-events')
      .set('Authorization', `Bearer ${A_MAESTRO_USER.token}`)
      .expect(403);
  }, 10000);

  it('anyone can record a landing visit, and an Admin can read daily counts per source', async () => {
    await request(app.getHttpServer()).post('/landing-visits').send({ source: 'dmacademy-post' }).expect(201);
    await request(app.getHttpServer()).post('/landing-visits').send({ source: 'dmacademy-post' }).expect(201);
    await request(app.getHttpServer()).post('/landing-visits').send({}).expect(201);

    const counts = (
      await request(app.getHttpServer())
        .get('/landing-visits')
        .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
        .expect(200)
    ).body as LandingVisitsDailyCount[];
    const bySource = Object.fromEntries(counts.map((c) => [c.source, c.count]));
    expect(bySource['dmacademy-post']).toBe(2);
    expect(bySource['direct']).toBe(1);
  }, 10000);

  afterEach(async () => {
    await app.close();
  });
});

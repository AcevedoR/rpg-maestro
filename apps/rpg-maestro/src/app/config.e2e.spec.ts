import { FakeJwtToken, TestUsersFixture } from '@rpg-maestro/test-utils';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ClientConfig } from '@rpg-maestro/rpg-maestro-api-contract';

/**
 * The endpoint the maestro UI reads to say, in the microphone tooltip, which interpreter is
 * actually answering. Covers the wiring the service unit tests cannot: the route, the guard,
 * and that a server with no TypeSafe key reports itself unavailable rather than failing.
 */
describe('Client config API', () => {
  let app: INestApplication;
  let AN_ADMIN_USER: FakeJwtToken;
  let A_MAESTRO_USER: FakeJwtToken;

  beforeEach(async () => {
    process.env.DATABASE = 'in-memory';
    process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
    process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
    process.env.AUTH_JWT_AUDIENCE = 'http://localhost:3018';
    process.env.AUTH_ISSUER = 'http://localhost:3018/test-utils/fake-idp';
    process.env.AUDIO_FILE_UPLOADER_SERVICE_TOKEN = 'unit-tests-service-token';
    process.env.PORT = '3018';
    process.env.NODE_ENV = 'unit-tests';
    process.env.CONFIGURATION_ENV = 'unit-tests';
    process.env.LOG_LEVEL = 'WARN';
    delete process.env.TYPESAFE_API_KEY;
    delete process.env.TYPESAFE_DEFAULT_MODEL;
    const { bootstrap } = await import('../app-bootstrap');
    app = await bootstrap();
    const users = await request(app.getHttpServer())
      .post('/test-utils/create-test-users-fixtures')
      .expect(201)
      .then((httpResponse) => httpResponse.body as TestUsersFixture);
    AN_ADMIN_USER = users.an_admin_user;
    A_MAESTRO_USER = users.a_maestro_user;
  });

  it('tells a maestro which interpreter answers, and that a keyless server has none', async () => {
    const config = await request(app.getHttpServer())
      .get('/config')
      .set('Authorization', `Bearer ${A_MAESTRO_USER.token}`)
      .expect(200)
      .then((httpResponse) => httpResponse.body as ClientConfig);

    expect(config.voiceInterpretation.provider).toBe('typesafe-ai');
    expect(config.voiceInterpretation.isAvailable).toBe(false);
    expect(config.voiceInterpretation.model).toBeNull();
    expect(config.voiceInterpretation.confidenceThreshold).toBe(0.6);
  }, 10000);

  it('reports the pinned model and availability once a key is configured', async () => {
    process.env.TYPESAFE_API_KEY = 'apikey_not-a-real-key';
    process.env.TYPESAFE_DEFAULT_MODEL = 'jev-1.13.0';

    const config = await request(app.getHttpServer())
      .get('/config')
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(200)
      .then((httpResponse) => httpResponse.body as ClientConfig);

    expect(config.voiceInterpretation.isAvailable).toBe(true);
    expect(config.voiceInterpretation.model).toBe('jev-1.13.0');
  }, 10000);

  it('is not readable without a token', async () => {
    await request(app.getHttpServer()).get('/config').expect(401);
  }, 10000);

  afterEach(async () => {
    delete process.env.TYPESAFE_API_KEY;
    delete process.env.TYPESAFE_DEFAULT_MODEL;
    // each test bootstraps its own app, so this one has to release the port
    await app.close();
  });
});

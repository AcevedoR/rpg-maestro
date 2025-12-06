process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3011';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';

import { INestApplication } from '@nestjs/common';

import request from 'supertest';

describe('testing healthcheck respond ok and 200', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH_ISSUER = 'http://localhost:3014/test-utils/fake-idp';
    process.env.AUTH_JWT_AUDIENCE = 'http://localhost:3014';
    const { bootstrap } = await import('../app-bootstrap');
    app = await bootstrap();
  });

  it(`GET: /health`, () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      info: {},
      error: {},
      details: {},
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

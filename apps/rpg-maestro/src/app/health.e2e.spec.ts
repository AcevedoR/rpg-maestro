process.env.DATABASE = 'in-memory';
process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
process.env.PORT = '3011';
process.env.NODE_ENV = 'unit-tests';
process.env.CONFIGURATION_ENV = 'unit-tests';

import { AppModule } from './app.module';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

const request = require('supertest');

describe('testing healthcheck respond ok and 200', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
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

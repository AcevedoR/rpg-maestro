import { FakeJwtToken, TestUsersFixture } from '@rpg-maestro/test-utils';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { parseAndValidateDto, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { UpdateUserRole } from '@rpg-maestro/rpg-maestro-api-contract';
import { Role } from '../auth/role.enum';

describe('Admin API', () => {
  let app: INestApplication;

  let AN_ADMIN_USER: FakeJwtToken;
  let A_MAESTRO_USER: FakeJwtToken;
  let A_MINSTREL_USER: FakeJwtToken;

  beforeEach(async () => {
    process.env.DATABASE = 'in-memory';
    process.env.DEFAULT_AUDIO_FILE_UPLOADER_API_URL = 'http://localhost:8098/not-used-in-this-test';
    process.env.DEFAULT_FRONTEND_DOMAIN = 'http://localhost:4300/not-used-in-this-test';
    process.env.AUTH_JWT_AUDIENCE = 'http://localhost:3016'
    process.env.AUTH_ISSUER = 'http://localhost:3016/test-utils/fake-idp'
    process.env.PORT = '3016';
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
    A_MINSTREL_USER = users.a_minstrel_user;
  });

  it('an Admin can get all sessions', async () => {
    await request(app.getHttpServer())
      .get('/maestro/admin/sessions')
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(200);
  }, 10000);
  it('a Maestro is forbidden to get all sessions', async () => {
    await request(app.getHttpServer())
      .get('/maestro/admin/sessions')
      .set('Authorization', `Bearer ${A_MAESTRO_USER.token}`)
      .expect(403);
  }, 10000);

  it('an Admin can get all users', async () => {
    await request(app.getHttpServer())
      .get('/maestro/admin/users')
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(200);
  }, 10000);
  it('a Maestro is forbidden to get all users', async () => {
    await request(app.getHttpServer())
      .get('/maestro/admin/users')
      .set('Authorization', `Bearer ${A_MAESTRO_USER.token}`)
      .expect(403);
  }, 10000);


  it('an Admin can promote a Minstrel to Maestro', async () => {
    const targetedUser = A_MINSTREL_USER.email;
    await request(app.getHttpServer())
      .put('/maestro/admin/users/:userId/role'.replace(':userId', targetedUser))
      .send(await parseAndValidateDto(UpdateUserRole, {role: Role.MAESTRO}))
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(200);
    const res = (await request(app.getHttpServer())
      .get('/maestro/admin/users/:userId'.replace(':userId', targetedUser))
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(200)).body as User;
    expect(res).toHaveProperty('role', Role.MAESTRO)
  }, 10000);
  it('an Admin cannot promote anybody to Admin', async () => {
    const targetedUser = A_MINSTREL_USER.email;
    const res = (await request(app.getHttpServer())
      .put('/maestro/admin/users/:userId/role'.replace(':userId', targetedUser))
      .send(await parseAndValidateDto(UpdateUserRole, {role: Role.ADMIN}))
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(400)).body as string;
    expect(JSON.stringify(res)).contain("cannot give Admin role");
  }, 10000);
  it('an Admin cannot demote itself by mistake', async () => {
    const targetedUser = AN_ADMIN_USER.email;
    const res = (await request(app.getHttpServer())
      .put('/maestro/admin/users/:userId/role'.replace(':userId', targetedUser))
      .send(await parseAndValidateDto(UpdateUserRole, {role: Role.MAESTRO}))
      .set('Authorization', `Bearer ${AN_ADMIN_USER.token}`)
      .expect(400)).body as string;
    expect(JSON.stringify(res)).contain("cannot change Admin role");
  }, 10000);

  afterEach(async () => {
    await app.close();
  });
});

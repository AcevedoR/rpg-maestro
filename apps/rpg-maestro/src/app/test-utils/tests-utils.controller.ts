import { Controller, HttpException, Inject, Post } from '@nestjs/common';
import { isProductionEnv } from '../config';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { User } from '@rpg-maestro/rpg-maestro-api-contract';
import { FakeJwtToken, generateFakeJwtToken } from './auth';
import { UsersDatabase } from '../user-management/users-database';

export interface TestUsersFixture{
  an_admin_user: FakeJwtToken,
  a_maestro_user: FakeJwtToken,
}

@Controller('test-utils')
export class TestsUtilsController {
  private readonly usersDb: UsersDatabase;

  constructor(
    @Inject(DatabaseWrapperConfiguration)
    private readonly dbConfig: DatabaseWrapperConfiguration
  ) {
    this.usersDb = this.dbConfig.getUsersDB();
  }

  @Post('create-test-users-fixtures')
  async createTestUsersFixtures(): Promise<TestUsersFixture> {
    if (isProductionEnv()) {
      throw new HttpException('POST: create-test-users-fixtures is only possible in dev or test env', 409);
    }
    const adminUser: User = {
      id: 'an.admin.user.23284283OUO28Ufhjdsfj@fourgate.cloud',
      created_at: Date.now(),
      updated_at: undefined,
      role: 'ADMIN',
      sessions: {},
    };
    await this.usersDb.save(adminUser);
    const admin = generateFakeJwtToken(adminUser.id);

    const maestroUser: User = {
      id: 'a.maestro.user.O8JKNKJN2309I0391U3I2@fourgate.cloud',
      created_at: Date.now(),
      updated_at: undefined,
      role: 'MAESTRO',
      sessions: {},
    };
    await this.usersDb.save(maestroUser);
    const maestro = generateFakeJwtToken(maestroUser.id);

    return {an_admin_user: admin, a_maestro_user: maestro};
  }
}

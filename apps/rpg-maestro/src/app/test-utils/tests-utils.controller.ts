import { Controller, HttpException, Inject, Post } from '@nestjs/common';
import { isProductionEnv } from '../config';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { User } from '@rpg-maestro/rpg-maestro-api-contract';
import { UsersDatabase } from '../maestro-api/UsersDatabase';
import { FakeJwtToken, generateFakeJwtToken } from './auth';

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
  async createTestUsersFixtures() {
    if (isProductionEnv()) {
      throw new HttpException('POST: create-test-users-fixtures is only possible in dev or test env', 409);
    }
    const adminUser: User = {
      id: 'acevedor.dev@gmail.com',
      created_at: Date.now(),
      updated_at: undefined,
      role: 'ADMIN',
      sessions: {},
    };
    await this.usersDb.save(adminUser);
    const token = generateFakeJwtToken(adminUser.id);
    return token;
  }
}

import { Controller, HttpException, Inject, Post } from '@nestjs/common';
import { isProductionEnv } from '../config';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { User } from '@rpg-maestro/rpg-maestro-api-contract';
import { UsersDatabase } from '../users-management/users-database';
import { FakeJwtToken, generateFakeJwtToken } from '@rpg-maestro/test-utils';
import { TrackService } from '../maestro-api/TrackService';

export interface TestUsersFixture {
  an_admin_user: FakeJwtToken;
  a_maestro_user: FakeJwtToken;
  a_maestro_B_user: FakeJwtToken;
  a_minstrel_user: FakeJwtToken;
}

@Controller('test-utils')
export class TestsUtilsController {
  private readonly usersDb: UsersDatabase;

  constructor(
    @Inject(DatabaseWrapperConfiguration)
    private readonly dbConfig: DatabaseWrapperConfiguration,
    @Inject() private trackService: TrackService
  ) {
    this.usersDb = this.dbConfig.getUsersDB();
  }

  private async createUserAndToken(id: string, role: User['role']): Promise<FakeJwtToken> {
    const user: User = {
      id,
      created_at: Date.now(),
      updated_at: undefined,
      role,
      sessions: {},
    };
    await this.usersDb.save(user);
    return await generateFakeJwtToken(user.id);
  }

  @Post('create-test-users-fixtures')
  async createTestUsersFixtures(): Promise<TestUsersFixture> {
    if (isProductionEnv()) {
      throw new HttpException('POST: create-test-users-fixtures is only possible in dev or test env', 409);
    }
    const an_admin_user = await this.createUserAndToken('an.admin.user.23284283OUO28Ufhjdsfj@fourgate.cloud', 'ADMIN');
    const a_maestro_user = await this.createUserAndToken('a.maestro.user.O8JKNKJN2309I0391U3I2@fourgate.cloud', 'MAESTRO');
    const a_maestro_B_user = await this.createUserAndToken('a.maestro.B.user.SDKDHQ87Y09I0391U3I2@fourgate.cloud', 'MAESTRO');
    const a_minstrel_user = await this.createUserAndToken('a.minstrel.user.fdslfSFLIJ23U4OE2323@fourgate.cloud', 'MINSTREL');

    return { an_admin_user, a_maestro_user, a_maestro_B_user, a_minstrel_user };
  }
}

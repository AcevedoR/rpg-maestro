import { Controller, Get, HttpException, Inject, Post } from '@nestjs/common';
import { isProductionEnv } from '../config';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { UsersDatabase } from '../users-management/users-database';
import { FakeJwtToken, generateFakeJwtToken, getJWKS, TestUsersFixture } from '@rpg-maestro/test-utils';
import { JWK } from 'jose';
import * as process from 'node:process';


@Controller('test-utils')
export class TestsUtilsController {
  private readonly usersDb: UsersDatabase;

  constructor(
    @Inject(DatabaseWrapperConfiguration)
    private readonly dbConfig: DatabaseWrapperConfiguration
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
    return await this.generateToken(user.id);
  }

  private async generateToken(userId: UserID) {
    return await generateFakeJwtToken(userId, {
      audience: process.env.AUTH_JWT_AUDIENCE,
      issuer: process.env.AUTH_ISSUER,
    });
  }

  @Post('create-test-users-fixtures')
  async createTestUsersFixtures(): Promise<TestUsersFixture> {
    if (isProductionEnv()) {
      throw new HttpException('POST: create-test-users-fixtures is only possible in dev or test env', 409);
    }
    const an_admin_user = await this.createUserAndToken('an.admin.user.23284283OUO28Ufhjdsfj@rpgmaestro.app', 'ADMIN');
    const a_maestro_user = await this.createUserAndToken(
      'a.maestro.user.O8JKNKJN2309I0391U3I2@rpgmaestro.app',
      'MAESTRO'
    );
    const a_maestro_B_user = await this.createUserAndToken(
      'a.maestro.B.user.SDKDHQ87Y09I0391U3I2@rpgmaestro.app',
      'MAESTRO'
    );
    const a_minstrel_user = await this.createUserAndToken(
      'a.minstrel.user.fdslfSFLIJ23U4OE2323@rpgmaestro.app',
      'MINSTREL'
    );
    const a_new_user = await this.generateToken('a.new.user.3333S43FLIJ23U4OE2323@rpgmaestro.app');

    return { an_admin_user, a_maestro_user, a_maestro_B_user, a_minstrel_user, a_new_user };
  }

  @Get('/fake-idp/.well-known/jwks.json')
  jwksServer(): Promise<{ keys: JWK[] }> {
    if (isProductionEnv()) {
      throw new HttpException('GET: .well-known/jwks.json is only possible in dev or test env', 409);
    }
    return getJWKS();
  }
}

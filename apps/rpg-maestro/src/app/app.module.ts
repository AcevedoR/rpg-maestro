import { Module } from '@nestjs/common';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthenticatedMaestroController } from './AuthenticatedMaestroController';
import { PlayersController } from './PlayersController';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'assets'),
      serveRoot: '/public',

      serveStaticOptions: { redirect: false },
    }),
    CacheModule.register(),
],
  controllers: [AuthenticatedMaestroController, PlayersController],
  providers: [DatabaseWrapperConfiguration],
})
export class AppModule {}

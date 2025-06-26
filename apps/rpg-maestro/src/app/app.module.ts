import { Module } from '@nestjs/common';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthenticatedMaestroController } from './AuthenticatedMaestroController';
import { PlayersController } from './PlayersController';
import { DatabaseModule } from './infrastructure/database.module';
import { PlayersService } from './players-api/players-service';
import { MaestroApiModule } from './maestro-api/maestro-api.module';
import { HealthModule } from './health.module';
import { NetworkingConfiguration } from './NetworkingConfiguration';
import { isDevOrTestEnv } from './config';
import { TrackCollectionModule } from './track-collection/track-collection.module';
import { AuthGuardsModule } from './auth/auth-guards.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'assets'),
      serveRoot: '/public',
      serveStaticOptions: { redirect: false },
    }),
    CacheModule.register(),
    DatabaseModule,
    MaestroApiModule,
    TrackCollectionModule,
    HealthModule,
    AuthGuardsModule,
    ...(isDevOrTestEnv() ? [require('./test-utils/tests-utils.module').TestsUtilsModule] : []),
  ],
  controllers: [AuthenticatedMaestroController, PlayersController],
  providers: [
    PlayersService,
    NetworkingConfiguration,
    {
      provide: 'NetworkingConfiguration_DEFAULT_FRONTEND_DOMAIN',
      useValue: process.env.DEFAULT_FRONTEND_DOMAIN,
    },
  ],
})
export class AppModule {}

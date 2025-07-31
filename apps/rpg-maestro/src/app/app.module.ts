import { Module } from '@nestjs/common';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthenticatedMaestroController } from './AuthenticatedMaestroController';
import { PlayersController } from './PlayersController';
import { DatabaseModule } from './infrastructure/database.module';
import { MaestroApiModule } from './maestro-api/maestro-api.module';
import { HealthModule } from './health.module';
import { NetworkingConfiguration } from './NetworkingConfiguration';
import { isDevOrTestEnv } from './config';
import { TrackCollectionModule } from './track-collection/track-collection.module';
import { AuthGuardsModule } from './auth/auth-guards.module';
import { SessionModule } from './sessions/sessions.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'assets'),
      serveRoot: '/public',
      serveStaticOptions: { redirect: false },
    }),
    DatabaseModule,
    MaestroApiModule,
    TrackCollectionModule,
    SessionModule,
    AdminModule,
    HealthModule,
    AuthGuardsModule,
    ...(isDevOrTestEnv() ? [require('./test-utils/tests-utils.module').TestsUtilsModule] : []),
  ],
  controllers: [AuthenticatedMaestroController, PlayersController],
  providers: [
    NetworkingConfiguration,
    {
      provide: 'NetworkingConfiguration_DEFAULT_FRONTEND_DOMAIN',
      useValue: process.env.DEFAULT_FRONTEND_DOMAIN,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthenticatedMaestroController } from './AuthenticatedMaestroController';
import { PlayersController } from './PlayersController';
import { DatabaseWrapperConfiguration } from './DatabaseWrapperConfiguration';
import { RunningJobsDatabase } from './maestro-api/RunningJobsDatabase';
import { InMemoryRunningJobsDatabase } from './infrastructure/InMemoryRunningJobsDatabase';

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
  providers: [
    DatabaseWrapperConfiguration,
    {
      provide: RunningJobsDatabase,
      useClass: InMemoryRunningJobsDatabase
    }
  ],
})
export class AppModule {}

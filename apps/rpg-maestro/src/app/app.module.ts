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
    HealthModule,
  ],
  controllers: [AuthenticatedMaestroController, PlayersController],
  providers: [PlayersService],
})
export class AppModule {}

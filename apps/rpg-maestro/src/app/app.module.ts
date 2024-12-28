import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'assets'),
      serveRoot: '/public',

      serveStaticOptions: { redirect: false },
    }),
    CacheModule.register(),
],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { checkValidConfig } from './config';

async function bootstrap() {
  checkValidConfig();
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: '*',
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  }); // TODO fix this
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application audio-file-uploader is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();

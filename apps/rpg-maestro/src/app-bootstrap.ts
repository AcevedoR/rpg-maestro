import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { NetworkingConfiguration } from './app/NetworkingConfiguration';
import { LogLevel } from '@nestjs/common/services/logger.service';

export async function bootstrap(): Promise<INestApplication> {
  const env = process.env['NODE' + '_ENV'] || 'development';
  const configurationEnv = process.env['CONFIGURATION_ENV'] || 'development';
  Logger.log(`starting app in env: ${env} or ${configurationEnv}`);

  const logLevels: Record<string, LogLevel[]>  = {
    TRACE: ['log', 'error', 'warn', 'debug', 'verbose'],
    DEBUG: ['log', 'error', 'warn', 'debug'],
    INFO: ['log', 'error', 'warn'],
    WARN: ['error', 'warn'],
  };
  let configuredLogLevel: LogLevel[] | null;
  if (process.env.LOG_LEVEL) {
    if(logLevels[process.env.LOG_LEVEL]){
      configuredLogLevel = logLevels[process.env.LOG_LEVEL];
    } else {
      throw new Error(`invalid LOG_LEVEL value configured: ${process.env.LOG_LEVEL}, available levels are: ${Object.keys(logLevels)}`);
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: configuredLogLevel ?? ['log', 'error', 'warn', 'fatal'],
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());

  const documentFactory = () =>
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('rpg-maestro API')
        .setDescription(
          'For /maestro API, use your CF_Authorization cookie, for example: curl -H "cookie: CF_Authorization=XXXX" https://fourgate.cloud/api/maestro/sessions/default-current-session/tracks\nthis doc is WIP, bodies and responses are not documented yet'
        )
        .addCookieAuth('CF_Authorization')
        .build()
    );
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors({
    credentials: true,
    origin: async (requestOrigin: string, next: (err: Error | null, origin?: string[]) => void) => {
      const origin = app.get(NetworkingConfiguration).getDefaultFrontEndDomain();
      next(null, [origin]);
    },
  });
  const globalPrefix = '';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  return app;
}

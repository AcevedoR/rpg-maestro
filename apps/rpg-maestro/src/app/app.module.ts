import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileUploadService } from './infrastructure/fileUpload/FileUploadService';
import * as process from 'node:process';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'assets'),
      serveRoot: '/public',

      serveStaticOptions: { redirect: false },
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: `${process.env.FILESERVER_PATH ? process.env.FILESERVER_PATH : '.'}/uploads`,
        filename: (req, file, cb) => {
          const filename = `${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
    CacheModule.register(),
],
  controllers: [AppController],
  providers: [FileUploadService],
})
export class AppModule {}

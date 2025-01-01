import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import process from 'node:process';
import { FileUploadService } from './fileUpload/FileUploadService';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: `${process.env.FILESERVER_PATH ? process.env.FILESERVER_PATH : '.'}/uploads`,
        filename: (req, file, cb) => {
          const filename = `${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'assets'),
      serveRoot: '/public',
      serveStaticOptions: { redirect: false },
    }),
  ],
  controllers: [AppController],
  providers: [FileUploadService],
})
export class AppModule {}

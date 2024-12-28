import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import process from 'node:process';
import { FileUploadService } from './fileUpload/FileUploadService';

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
  ],
  controllers: [AppController],
  providers: [FileUploadService],
})
export class AppModule {}

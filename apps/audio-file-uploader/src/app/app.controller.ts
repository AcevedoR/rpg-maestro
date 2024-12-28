import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileUploadService } from './fileUpload/FileUploadService';

@Controller()
export class AppController {
  constructor(private readonly fileUploadService: FileUploadService) {
    this.fileUploadService = fileUploadService;
  }

  @Post('/upload/audio')
  @UseInterceptors(FileInterceptor('file'))
  uploadTrack(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file);
  }
}

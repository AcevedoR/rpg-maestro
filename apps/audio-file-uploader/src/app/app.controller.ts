import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileUploadService } from './fileUpload/FileUploadService';
import { uploadAudioFromYoutube } from './fileUpload/fromYoutube/UploadFromYoutubeService';
import { UploadAudioFromYoutubeRequest } from '@rpg-maestro/audio-file-uploader-api-contract';

@Controller()
export class AppController {
  constructor(private readonly fileUploadService: FileUploadService) {
    this.fileUploadService = fileUploadService;
  }

  @Post('/upload/audio')
  @UseInterceptors(FileInterceptor('file'))
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file);
  }
  @Post('/upload/audio/from-youtube')
  uploadAudioFromYoutube(@Body() uploadRequest: UploadAudioFromYoutubeRequest) {
    return uploadAudioFromYoutube(uploadRequest);
  }
}

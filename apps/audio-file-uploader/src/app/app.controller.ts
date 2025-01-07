import { Body, Controller, Get, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileUploadService } from './fileUpload/FileUploadService';
import {
  UploadAudioFromYoutubeJobDto,
  UploadAudioFromYoutubeRequest,
} from '@rpg-maestro/audio-file-uploader-api-contract';
import { UploadFromYoutubeService } from './fileUpload/fromYoutube/UploadFromYoutubeService';

@Controller()
export class AppController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly uploadFromYoutubeService: UploadFromYoutubeService
  ) {
    this.fileUploadService = fileUploadService;
  }

  @Post('/upload/audio')
  @UseInterceptors(FileInterceptor('file'))
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file);
  }

  @Post('/upload/audio/from-youtube')
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadAudioFromYoutube(@Body() uploadRequest: UploadAudioFromYoutubeRequest): Promise<void> {
    await this.uploadFromYoutubeService.uploadAudioFromYoutube(uploadRequest);
  }

  @Get('/upload/audio/from-youtube')
  async getAudioFromYoutubeUploadJobs(): Promise<UploadAudioFromYoutubeJobDto[]> {
    return (await this.uploadFromYoutubeService.getAudioFromYoutubeUploadJobs()).map(
      (x) =>
        <UploadAudioFromYoutubeJobDto>{
          status: x.status,
          error: x.error,
          youtubeURL: x.youtubeUrlToUpload,
          createdDate: x.createdDate.getTime(),
          updatedDate: x.updatedDate.getTime(),
          uploadedFile: x.uploadedFile,
          uploadedFileLink: x.uploadedFileLink,
        }
    );
  }
}

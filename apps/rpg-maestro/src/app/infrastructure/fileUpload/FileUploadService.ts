import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('no file uploaded');
    }

    // validate file type
    // const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    // if (!allowedMimeTypes.includes(file.mimetype)) {
    //   throw new BadRequestException('invalid file type');
    // }

    // validate file size (e.g., max 200mb)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('file is too large!');
    }
    console.log(`uploading file ${file.filename} with size ${(file.size / 1024 / 1024).toFixed(2)}mb`);
    return {
      message: 'File uploaded successfully',
      fileURL: `https://fourgate.cloud/public/musics/uploads/${file.filename}`,
    };
  }
}

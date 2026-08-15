import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { dirname, join, parse } from 'path';
import process from 'node:process';

const AUDIO_FILE_SERVER_BASE_URL = process.env.AUDIO_FILE_SERVER_BASE_URL;

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
];

export const MAX_UPLOAD_SIZE_BYTES = 300 * 1024 * 1024;
const TARGET_AUDIO_BITRATE_KBPS = 128;
// mp3s already at or below this bitrate are stored as-is instead of being re-encoded
const BITRATE_PASSTHROUGH_THRESHOLD_BPS = 160_000;

export interface FileUploadResult {
  message: string;
  fileURL: string;
}

@Injectable()
export class FileUploadService {
  async handleFileUpload(file: Express.Multer.File): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('no file uploaded');
    }

    // multer has already written the file to disk at this point: clean it up on rejection
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(file.mimetype)) {
      await this.deleteQuietly(file.path);
      throw new BadRequestException(`invalid file type: ${file.mimetype}, expected one of: ${ALLOWED_AUDIO_MIME_TYPES.join(', ')}`);
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      await this.deleteQuietly(file.path);
      throw new BadRequestException('file is too large!');
    }

    Logger.log(`uploading file ${file.filename} with size ${(file.size / 1024 / 1024).toFixed(2)}mb`);
    const finalFilename = await this.transcodeToMp3IfNeeded(file);
    return {
      message: 'File uploaded successfully',
      fileURL: `${AUDIO_FILE_SERVER_BASE_URL}/uploads/${finalFilename}`,
    };
  }

  private async transcodeToMp3IfNeeded(file: Express.Multer.File): Promise<string> {
    const probed = await this.probe(file.path);
    if (probed.isMp3 && probed.bitrate !== undefined && probed.bitrate <= BITRATE_PASSTHROUGH_THRESHOLD_BPS) {
      return file.filename;
    }

    const targetFilename = `${parse(file.filename).name}.mp3`;
    const targetPath = join(dirname(file.path), targetFilename);
    // an mp3 above the bitrate threshold re-encodes onto its own name: go through a temp file
    const transcodePath = targetPath === file.path ? `${targetPath}.transcoding.mp3` : targetPath;

    try {
      await this.transcodeToMp3(file.path, transcodePath);
    } catch (error) {
      await this.deleteQuietly(file.path);
      await this.deleteQuietly(transcodePath);
      Logger.error(`transcoding of ${file.filename} failed: ${error.message}`);
      throw new BadRequestException(`file could not be processed as audio: ${file.filename}`);
    }

    if (transcodePath !== targetPath) {
      await fs.rename(transcodePath, targetPath);
    } else {
      await this.deleteQuietly(file.path);
    }
    const { size } = await fs.stat(targetPath);
    Logger.log(
      `transcoded ${file.filename} (${(file.size / 1024 / 1024).toFixed(2)}mb) to ${targetFilename} (${(
        size /
        1024 /
        1024
      ).toFixed(2)}mb) at ${TARGET_AUDIO_BITRATE_KBPS}kbps`
    );
    return targetFilename;
  }

  private async probe(filePath: string): Promise<{ isMp3: boolean; bitrate: number | undefined }> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) {
          Logger.warn(`ffprobe failed for ${filePath}, will transcode: ${err.message}`);
          resolve({ isMp3: false, bitrate: undefined });
          return;
        }
        const formatName = data.format?.format_name ?? '';
        const bitrate = data.format?.bit_rate ? Number(data.format.bit_rate) : undefined;
        resolve({ isMp3: formatName.split(',').includes('mp3'), bitrate });
      });
    });
  }

  private async transcodeToMp3(inputPath: string, outputPath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate(TARGET_AUDIO_BITRATE_KBPS)
        .format('mp3')
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(outputPath);
    });
  }

  private async deleteQuietly(filePath: string): Promise<void> {
    if (!filePath) {
      return;
    }
    try {
      await fs.unlink(filePath);
    } catch {
      // file may not exist (e.g. transcode failed before creating output)
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { createWriteStream } from 'fs';
import process from 'node:process';
import { UploadAudioFromYoutubeRequest } from '@rpg-maestro/audio-file-uploader-api-contract';
import { UploadFromYoutubeJob } from './UploadFromYoutubeJob';
import { UploadFromYoutubeJobsStore } from './upload-from-youtube-jobs-store';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIRECTORY = `${process.env.FILESERVER_PATH ? process.env.FILESERVER_PATH : '.'}/uploads`;
const AUDIO_FILE_SERVER_BASE_URL = process.env.AUDIO_FILE_SERVER_BASE_URL;

@Injectable()
export class UploadFromYoutubeService {
  constructor(private readonly uploadFromYoutubeJobsStore: UploadFromYoutubeJobsStore) {}

  async uploadAudioFromYoutube(uploadRequest: UploadAudioFromYoutubeRequest): Promise<void> {
    let i = 0;
    Promise.all(
      uploadRequest.urls.map(async (url) => {
        const jobId = randomUUID();
        await this.uploadFromYoutubeJobsStore.set(jobId, new UploadFromYoutubeJob(url));

        if (i > 0) {
          await sleep(200);
        }
        i++;
        Logger.log(`begin downloading ${url}`);
        if (!ytdl.validateURL(url)) {
          const job = await this.uploadFromYoutubeJobsStore.get(jobId);
          job.failed(`invalid youtube URL: ${url}`);
          return;
        }

        try {
          const info = await ytdl.getInfo(url);
          const fileName = (info.videoDetails.title ?? `audio_${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '_') + '.mp3';
          const filePath = join(UPLOAD_DIRECTORY, fileName);
          const audioStream = ytdl(url, {
            filter: 'audioonly',
            highWaterMark: 512 * 1024 * 1024, // 32MB chunks
          });

          await new Promise((resolve, reject) => {
            const fileStream = createWriteStream(filePath);
            ffmpeg(audioStream)
              .audioCodec('libmp3lame')
              .audioBitrate(128)
              .format('mp3')
              .on('error', (err) => {
                Logger.error(`Error converting to MP3 for URL ${url}: ${err.message}`);
                console.trace(err);
                fileStream.destroy(err);
                reject(err);
              })
              .on('end', () => {
                Logger.log(`MP3 saved at: ${filePath}`);
                resolve(null);
              })
              .pipe(fileStream);
          });

          const job = await this.uploadFromYoutubeJobsStore.get(jobId);
          job.succedeed(fileName, `${AUDIO_FILE_SERVER_BASE_URL}/uploads/${fileName}`);
          return;
        } catch (error) {
          Logger.error(`Error while downloading audio from URL ${url}: ${error.message}`);
          console.trace(error);
          const job = await this.uploadFromYoutubeJobsStore.get(jobId);
          job.failed(error.message);
          return;
        }
      })
    );
  }

  async getAudioFromYoutubeUploadJobs(): Promise<UploadFromYoutubeJob[]> {
    return this.uploadFromYoutubeJobsStore.getAll();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

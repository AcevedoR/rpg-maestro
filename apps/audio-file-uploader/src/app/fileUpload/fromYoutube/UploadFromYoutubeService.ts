import { UploadAudioFromYoutubeRequest } from './UploadAudioFromYoutubeRequest';
import { UploadAudioFromYoutubeResponse, UploadAudioFromYoutubeResponseForUrl } from './UploadAudioFromYoutubeResponse';
import { Logger } from '@nestjs/common';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { createWriteStream } from 'fs';
import process from 'node:process';

const UPLOAD_DIRECTORY = `${process.env.FILESERVER_PATH ? process.env.FILESERVER_PATH : '.'}/uploads`;

export async function uploadAudioFromYoutube(
  uploadRequest: UploadAudioFromYoutubeRequest
): Promise<UploadAudioFromYoutubeResponse> {
  let i = 0;
  const uploadedFilesLinks = [];

  const uploadResult = await Promise.all(
    uploadRequest.urls.map(async (url) => {
      if (i > 0) {
        await sleep(200);
      }
      i++;
      Logger.log(`begin downloading ${url}`);
      if (!ytdl.validateURL(url)) {
        return <UploadAudioFromYoutubeResponseForUrl>{ url: url, status: 'error', message: 'Invalid YouTube URL' };
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

        return <UploadAudioFromYoutubeResponseForUrl>{
          url: url,
          status: 'ok',
          uploadedFile: fileName,
          uploadedFileLink: `https://fourgate.cloud/public/musics/uploads/${fileName}`,
        };
      } catch (error) {
        Logger.error(`Error while downloading audio from URL ${url}: ${error.message}`);
        console.trace(error);
        return <UploadAudioFromYoutubeResponseForUrl>{ url: url, status: 'error', message: error.message };
      }
    })
  );
  return { uploadResult: uploadResult };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

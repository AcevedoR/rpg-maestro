import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { basename, join } from 'path';
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
        if (!isValidYoutubeUrl(url)) {
          const job = await this.uploadFromYoutubeJobsStore.get(jobId);
          job.failed(`invalid youtube URL: ${url}`);
          return;
        }

        try {
          const filePath = await downloadAudioAsMp3(url);
          Logger.log(`MP3 saved at: ${filePath}`);
          const fileName = basename(filePath);
          const job = await this.uploadFromYoutubeJobsStore.get(jobId);
          job.succedeed(fileName, `${AUDIO_FILE_SERVER_BASE_URL}/uploads/${fileName}`);
          return;
        } catch (error) {
          Logger.error(`Error while downloading audio from URL ${url}: ${error.message}`);
          console.error(error);
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

function isValidYoutubeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  return ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host);
}

/**
 * Downloads the audio of a youtube video as mp3 into UPLOAD_DIRECTORY using yt-dlp,
 * and resolves with the final file path (printed by yt-dlp on stdout).
 */
function downloadAudioAsMp3(url: string): Promise<string> {
  const args = [
    '--no-playlist',
    '--restrict-filenames',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '128K',
    // node is always available since this app runs on it; without a JS runtime,
    // yt-dlp's youtube extraction is deprecated and can miss formats
    '--js-runtimes',
    'node',
    '-o',
    join(UPLOAD_DIRECTORY, '%(title)s.%(ext)s'),
    '--print',
    'after_move:filepath',
    '--no-simulate',
  ];
  if (process.env.FFMPEG_PATH) {
    args.push('--ffmpeg-location', process.env.FFMPEG_PATH);
  }
  args.push(url);

  return new Promise((resolve, reject) => {
    const ytdlp = spawn(process.env.YTDLP_PATH || 'yt-dlp', args);
    let stdout = '';
    let stderr = '';
    ytdlp.stdout.on('data', (chunk) => (stdout += chunk));
    ytdlp.stderr.on('data', (chunk) => (stderr += chunk));
    ytdlp.on('error', (err) => reject(new Error(`could not run yt-dlp: ${err.message}`)));
    ytdlp.on('close', (code) => {
      const filePath = stdout.trim();
      if (code === 0 && filePath) {
        resolve(filePath);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim().slice(-500)}`));
      }
    });
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

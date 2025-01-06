import { v4 as uuid } from 'uuid';
import path from 'path';
import { Database } from './Database';
import { getTrackDuration } from './audio/AudioHelper';
import {
  CreateTrackFromYoutubeResponseForUrl,
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TracksFromDirectoryCreation,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { getAllFilesFromCaddyFileServerDirectory } from '../infrastructure/FetchCaddyDirectory';
import { uploadAudioFromYoutube } from '../infrastructure/audio-file-uploader-client/AudioFileUploaderClient';
import { Logger } from '@nestjs/common';
import { RunningJob, RunningJobsDatabase, UploadYoutubeURLJob } from './RunningJobsDatabase';
import { Worker } from 'worker_threads';
import backgroundUploaderWorkerThreadFilePath from '../background-uploader/config';
import { URL as NodeURL } from "url";

export class TrackService {
  database: Database;
  runningJobsDatabase: RunningJobsDatabase;

  constructor(database: Database, runningJobsDatabase: RunningJobsDatabase) {
    this.database = database;
    this.runningJobsDatabase = runningJobsDatabase;
  }

  async createTrack(sessionId: string, trackCreation: TrackCreation): Promise<Track> {
    const now = Date.now();

    const url = new URL(trackCreation.url);
    const fileName = getFileName(url);
    await checkFileIfActuallyUsable(trackCreation.url);
    const duration = await getTrackDuration(url);

    const track: Track = {
      id: uuid(),
      sessionId: sessionId,
      created_at: now,
      updated_at: now,

      source: {
        origin_media: trackCreation.originMedia ?? 'same-server',
        origin_url: trackCreation.originUrl ?? trackCreation.url,
        origin_name: fileName,
      },

      name: trackCreation.name ?? fileName,
      url: trackCreation.url,
      duration: duration,
      tags: trackCreation.tags ?? [],
    };

    await this.database.save(track);

    return track;
  }

  async updateTrack(id: string, trackUpdate: TrackUpdate): Promise<Track> {
    const existing = await this.database.getTrack(id);

    existing.name = trackUpdate.name;
    existing.tags = trackUpdate.tags;
    existing.updated_at = Date.now();

    await this.database.save(existing);

    return existing;
  }

  async getAll(sessionId: string): Promise<Track[]> {
    return this.database.getAllTracks(sessionId);
  }

  async get(id: string): Promise<Track> {
    return this.database.getTrack(id);
  }

  async getSessionPlayingTracks(sessionId: string): Promise<SessionPlayingTracks> {
    return this.database.getCurrentSession(sessionId);
  }

  async createAllTracksFromDirectory(
    sessionId: string,
    tracksFromDirectoryCreation: TracksFromDirectoryCreation
  ): Promise<void> {
    await Promise.all(
      (
        await getAllFilesFromCaddyFileServerDirectory(tracksFromDirectoryCreation.directoryUrl)
      ).map((x) => this.createTrack(sessionId, x))
    );
  }

  async uploadAndCreateTrackFromYoutube(
    sessionId: string,
    uploadAndCreateTracksFromYoutubeRequest: UploadAndCreateTracksFromYoutubeRequest
  ): Promise<void> {
    await Promise.all(
      uploadAndCreateTracksFromYoutubeRequest.urls.map(async (url) => {
        const job: UploadYoutubeURLJob = {
          sessionId: sessionId,
          youtubeUrlToUpload: url,
          _type: 'UploadYoutubeURLJob',
        };
        await this.runningJobsDatabase.set(`${sessionId}-${url}`, new RunningJob(sessionId, 'running', null, job));
      })
    );

    //  await uploadAudioFromYoutube({
    //   urls: uploadAndCreateTracksFromYoutubeRequest.urls,
    // }); FIXME

    this.uploadAndCreateTrackFromYoutubeInBackground(sessionId, );
  }

  private async uploadAndCreateTrackFromYoutubeInBackground(
    sessionId: string
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const res= await this.runningJobsDatabase.getAll();
    Logger.log(`all running jobs: ${res}`);// TODO remove
    const thisService = this;
    // const worker = new Worker(backgroundUploaderWorkerThreadFilePath, {
    const worker = new Worker(new URL('./background-uploader-worker-thread.ts', import.meta.url)as NodeURL, {
      workerData: await this.runningJobsDatabase,
    });
    worker.on('message', (res) => {
      Logger.log(`backgroundUploaderWorkerThread sent data: ${res}`);
    });
    worker.on('error', (e) =>       Logger.error(`backgroundUploaderWorkerThread failed with error: ${e}`, e));
    worker.on('exit', (code) => Logger.log(`backgroundUploaderWorkerThread exited with code: ${code}`));

    sleep(1000).then(x => {
      this.runningJobsDatabase.set('ola', {} as RunningJob ).then(x => this.runningJobsDatabase.getAll().then(x => console.log(x)))
    });
    async function sleep(delay): Promise<void> {
      return new Promise(function (resolve) {
        setTimeout(() => {
          console.log('This message is logged after 2 seconds');
          resolve();
        }, delay);
      });
    }

    // for (const uploadResultForURL of uploadAudioFromYoutubeResponse.uploadResult) { TODO move to worker
    //   if (uploadResultForURL.status === 'ok') {
    //     try {
    //       const createdTrack = await this.createTrack(sessionId, {
    //         url: uploadResultForURL.uploadedFileLink,
    //         originUrl: uploadResultForURL.url,
    //         originMedia: 'youtube',
    //       });
    //       createsResults.push({
    //         status: 'created',
    //         url: uploadResultForURL.url,
    //         uploadedFile: uploadResultForURL.uploadedFile,
    //         uploadedFileLink: uploadResultForURL.uploadedFileLink,
    //         trackId: createdTrack.id,
    //         trackName: createdTrack.name,
    //       });
    //     } catch (err) {
    //       Logger.error(`failed creating track ${uploadResultForURL.uploadedFileLink} after uploading, err: ${err}`);
    //       createsResults.push({
    //         status: 'uploaded-but-creation-failed',
    //         url: uploadResultForURL.url,
    //         uploadedFile: uploadResultForURL.uploadedFile,
    //         uploadedFileLink: uploadResultForURL.uploadedFileLink,
    //       });
    //     }
    //   } else {
    //     createsResults.push({
    //       status: uploadResultForURL.status,
    //       url: uploadResultForURL.url,
    //     });
    //   }
    // }
  }
}

async function checkFileIfActuallyUsable(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok || response.status != 200) {
      const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
      console.log(`checkFileIfActuallyUsable failed with error: ${shortError}`, response);
      throw new Error(
        `Cannot create track, file not reachable, fetch error: ${shortError}, full error: ${await response.text()}`
      );
    }
  } catch (error) {
    if (error instanceof TypeError) {
      console.debug(error);
      if (error.message && error.message === 'fetch failed') {
        throw new Error(`Fetch network error: ${error}`);
      } else {
        throw new Error(`Fetch unhandled error: ${error}`);
      }
    } else {
      throw error;
    }
  }
}

function getFileName(fileUrl: URL) {
  const fileFullName = fileUrl.pathname;
  const extension = path.extname(fileFullName);
  return decodeURI(path.basename(fileFullName, extension));
}

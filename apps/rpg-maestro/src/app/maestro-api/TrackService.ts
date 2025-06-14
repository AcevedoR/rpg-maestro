import { v4 as uuid } from 'uuid';
import path from 'path';
import { TracksDatabase } from './TracksDatabase';
import { getTrackDuration } from './audio/AudioHelper';
import {
  Track,
  TrackCreation,
  TracksFromDirectoryCreation,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { getAllFilesFromCaddyFileServerDirectory } from '../infrastructure/audio-file-uploader-client/FetchCaddyDirectory';
import { TrackCreationFromYoutubeJob, TrackCreationFromYoutubeJobsStore } from './TrackCreationFromYoutubeJobsStore';
import { AudioFileUploaderClient } from '../track-creation-from-youtube-jobs-watcher/audio-file-uploader-client';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { TrackCreationFromYoutubeJobsWatcher } from '../track-creation-from-youtube-jobs-watcher/track-creation-from-youtube-jobs-watcher.service';

@Injectable()
export class TrackService {
  database: TracksDatabase;
  trackCreationFromYoutubeJobsStore: TrackCreationFromYoutubeJobsStore;
  trackCreationFromYoutubeJobsWatcher: TrackCreationFromYoutubeJobsWatcher;
  audioFileUploaderClient: AudioFileUploaderClient;

  constructor(
    @Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration,
    @Inject(TrackCreationFromYoutubeJobsStore) trackCreationFromYoutubeJobsStore: TrackCreationFromYoutubeJobsStore,
    @Inject(forwardRef(() => TrackCreationFromYoutubeJobsWatcher))
    trackCreationFromYoutubeJobsWatcher1: TrackCreationFromYoutubeJobsWatcher,
    @Inject(AudioFileUploaderClient) audioFileUploaderClient: AudioFileUploaderClient
  ) {
    console.log(databaseWrapper)
    this.database = databaseWrapper.getTracksDB();
    this.trackCreationFromYoutubeJobsStore = trackCreationFromYoutubeJobsStore;
    this.trackCreationFromYoutubeJobsWatcher = trackCreationFromYoutubeJobsWatcher1;
    this.audioFileUploaderClient = audioFileUploaderClient;
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
        Logger.log(`request track upload from youtube, sessionId: ${sessionId}, ytUrl: ${url}`);
        await this.trackCreationFromYoutubeJobsStore.set(
          `${sessionId}-${url}`,
          new TrackCreationFromYoutubeJob(sessionId, url)
        );
      })
    );

    await this.audioFileUploaderClient.uploadAudioFromYoutube({
      urls: uploadAndCreateTracksFromYoutubeRequest.urls,
    });

    this.trackCreationFromYoutubeJobsWatcher.wakeUp();
  }

  async getTrackFromYoutubeCreations(sessionId: string) {
    return this.trackCreationFromYoutubeJobsStore.getAllForSession(sessionId);
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

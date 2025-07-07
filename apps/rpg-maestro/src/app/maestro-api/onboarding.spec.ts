import express, { Express } from 'express';
import * as path from 'node:path';
import http from 'http';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { OnboardingService } from './onboarding.service';
import { TrackService } from './TrackService';
import { InMemoryTrackCreationFromYoutubeJobsStore } from '../infrastructure/persistence/in-memory/InMemoryTrackCreationFromYoutubeJobsStore.service';
import { TrackCreationFromYoutubeJobsWatcher } from '../track-creation-from-youtube-jobs-watcher/track-creation-from-youtube-jobs-watcher.service';
import { AudioFileUploaderClient } from '../track-creation-from-youtube-jobs-watcher/audio-file-uploader-client';
import { TrackCollectionService } from '../track-collection/track-collection.service';
import { UsersService } from '../users-management/users.service';

let onboardingService: OnboardingService;
let databases: DatabaseWrapperConfiguration;

let server: http.Server;
const app: Express = express();
const port = 3004;

beforeAll(async () => {
  app.use('/public', express.static(path.join(__dirname, '../../assets')));
  server = app.listen(port, () => {
    console.info(`[server]: Server serving static files is running at http://localhost:${port}`);
  });
});
beforeEach(() => {
  databases = new DatabaseWrapperConfiguration('in-memory');
  onboardingService = new OnboardingService(
    databases,
    new TrackService(
      new DatabaseWrapperConfiguration('in-memory'),
      new InMemoryTrackCreationFromYoutubeJobsStore(),
      null as TrackCreationFromYoutubeJobsWatcher,
      null as AudioFileUploaderClient
    ),
    new TrackCollectionService(databases),
    new UsersService(databases)
  );
});

describe('Onboarding', () => {
  it('onboarding should create a Maestro and its new Session', async () => {
    const userId = 'new-maestro-1';
    const newSessionTracks = await onboardingService.createNewUserWithSession(userId, {noCollections: true});

    expect(newSessionTracks.sessionId).toBeDefined();
    expect(newSessionTracks.sessionId.length).toBeGreaterThan(0);

    const newUser = await databases.getUsersDB().get(userId);
    expect(newUser).not.toBeNull();
    expect(newUser.id).toEqual(userId);
    expect(Object.keys(newUser.sessions)).toContain(newSessionTracks.sessionId);

    const session = await databases.getTracksDB().getSession(newSessionTracks.sessionId);
    expect(session).not.toBeNull();
    expect(session.sessionId).toEqual(newSessionTracks.sessionId);
  });
  it('cannot onboard twice', async () => {
    const userId = 'new-maestro-1';
    await onboardingService.createNewUserWithSession(userId, {noCollections: true});

    await expect(onboardingService.createNewUserWithSession(userId, {noCollections: true})).rejects.toThrow('already exists');
  });
  it('can onboard different users', async () => {
    await onboardingService.createNewUserWithSession('new-maestro-1', {noCollections: true});
    await onboardingService.createNewUserWithSession('new-maestro-2', {noCollections: true});
  });
});

afterAll(() => {
  server.close();
});

import express, { Express } from 'express';
import * as path from 'node:path';
import http from 'http';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { OnboardingService } from './onboarding.service';

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
  onboardingService = new OnboardingService(databases);
});

describe('Onboarding', () => {
  it('onboarding should create a Maestro and its new Session', async () => {
    const userId = 'new-maestro-1';
    const newSessionTracks = await onboardingService.createSession(userId);

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
    await onboardingService.createSession(userId);

    await expect(onboardingService.createSession(userId)).rejects.toThrow('already exists');
  });
  it('can onboard different users', async () => {
    await onboardingService.createSession('new-maestro-1');
    await onboardingService.createSession('new-maestro-2');
  });
});

afterAll(() => {
  server.close();
});

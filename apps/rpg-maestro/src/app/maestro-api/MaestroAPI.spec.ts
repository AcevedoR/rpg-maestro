import express, { Express } from 'express';
import * as path from 'node:path';
import http from 'http';
import { TrackService } from './TrackService';
import { InMemoryDatabase } from '../infrastructure/InMemoryDatabase';
import { ManageCurrentlyPlayingTracks } from './ManageCurrentlyPlayingTracks';
import { randomUUID } from 'node:crypto';

let createTrack: TrackService;
let manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;
const database = new InMemoryDatabase();

let server: http.Server;
const app: Express = express();
const port = 3003;

const CURRENT_DATE = Date.now();

beforeAll(() => {
  createTrack = new TrackService(database);
  manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(database);

  app.use('/public', express.static(path.join(__dirname, '../../assets')));
  server = app.listen(port, () => {
    console.log(`[server]: Server serving static files is running at http://localhost:${port}`);
  });
});
beforeEach(() => {
  database.tracksDatabase = [];
});

describe('CreateTrack API', () => {
  it('should return the created track', async () => {
    const res = await createTrack.createTrack(randomSessionId(), {
      url: `http://localhost:${port}/public/light-switch-sound-198508.mp3`,
    });
    expect(res.name).toEqual(`light-switch-sound-198508`);
    expect(res.source.origin_url).toEqual(`http://localhost:${port}/public/light-switch-sound-198508.mp3`);
    expect(res.source.origin_name).toEqual(`light-switch-sound-198508`);
  });

  it('should estimate the song length', async () => {
    const res = await createTrack.createTrack(randomSessionId(), {
      url: `http://localhost:${port}/public/light-switch-sound-198508.mp3`,
    });
    expect(res.name).toEqual(`light-switch-sound-198508`);
    expect(res.duration).toEqual(1488);
  });

  it('should fail when file is not reachable', async () => {
    await expect(
      createTrack.createTrack(randomSessionId(), {
        url: `http://localhost:${port}/public/unexisting-file.mp3`,
      })
    ).rejects.toThrow('file not reachable');
  });
});
describe('ManageCurrentlyPlaying track API', () => {
  it('change current track', async () => {
    jest.useFakeTimers().setSystemTime(CURRENT_DATE);
    const session = 'my-test-session-1';

    database.tracksDatabase = [
      {
        id: 'track-1',
        sessionId: session,
        created_at: CURRENT_DATE,
        updated_at: CURRENT_DATE,
        source: {
          origin_media: 'same-server',
          origin_name: 'unexisting-file.mp3',
          origin_url: 'url',
        },
        url: `http://localhost:${port}/public/light-switch-sound-198508.mp3`,
        name: 'track-1',
        duration: 1488,
        tags: [],
      },
    ];

    await manageCurrentlyPlayingTracks.changeSessionPlayingTracks(session, {
      currentTrack: {
        trackId: 'track-1',
      },
    });

    const res = await database.getCurrentSession(session);
    expect(res).toHaveProperty('currentTrack');
    expect(res.currentTrack.id).toEqual('track-1');
    expect(res.currentTrack.isPaused).toBeFalsy();
    expect(res.currentTrack.playTimestamp).toEqual(CURRENT_DATE);
    expect(res.currentTrack.trackStartTime).toEqual(0);
  });
});

afterAll(() => {
  server.close();
});

function randomSessionId(): string {
  return randomUUID();
}

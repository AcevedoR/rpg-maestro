import { test } from '@playwright/test';
import { SessionID, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { FakeJwtToken, initUsersFixture } from '@rpg-maestro/test-utils';

export const RPG_MAESTRO_URL = 'http://localhost:8099';

export interface UserWithGeneratedSession {
  sessionId: SessionID;
  token: string;
  email: string;
}

export async function generateNewSession(fakeJwt: FakeJwtToken): Promise<UserWithGeneratedSession> {
  return await test.step('generate a new session with a new user', async () => {
    try {
      const response = await fetch(`${RPG_MAESTRO_URL}/maestro/sessions`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${fakeJwt.token}`,
        },
      });
      if (!response.ok) {
        console.error(`POST /maestro/sessions failed for user: ${fakeJwt.email} ${response.status} ${response.statusText}`);
        throw new Error('fetch failed for error: ' + response);
      }
      const sessionPlayingTracks = (await response.json()) as SessionPlayingTracks;
      console.info('debut session: ', sessionPlayingTracks);
      const session = { sessionId: sessionPlayingTracks.sessionId, token: fakeJwt.token, email: fakeJwt.email };
      console.info('test session generated: ', session);
      return session;
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  });
}

export async function iniTracksFromFileServerFixture(jwtToken: FakeJwtToken, sessionId: string): Promise<void> {
  await test.step('init tracks from fileserver using api', async () => {
    try {
      const res = await fetch(`${RPG_MAESTRO_URL}/maestro/sessions/${sessionId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken.token}`,
        },
        body: JSON.stringify({
          url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
        }),
      });
      if (!res.ok) {
        const error = new Error(
          `Failed to initialize tracks from fileserver for session ${sessionId}: ${res.status} ${res.statusText}`
        );
        console.error(error.message);
        throw error;
      } else {
        console.info('init tracks from fileserver using api ok for session: ', sessionId);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  });
}
export async function initUsersFixtureSpec(){
  return await test.step('init tracks from fileserver using api', async () => {
    return await initUsersFixture(RPG_MAESTRO_URL);
  });
}

export interface CreateTrackOptions {
  url: string;
  name?: string;
  tags?: string[];
}

export async function createTrackViaApi(
  jwtToken: FakeJwtToken,
  sessionId: string,
  options: CreateTrackOptions
): Promise<{ id: string; name: string; tags: string[] }> {
  return await test.step(`create track "${options.name ?? options.url}"`, async () => {
    const res = await fetch(`${RPG_MAESTRO_URL}/maestro/sessions/${sessionId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken.token}`,
      },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      throw new Error(`Failed to create track: ${res.status} ${res.statusText}`);
    }
    return res.json();
  });
}

export async function setTrackToPlayViaApi(
  jwtToken: FakeJwtToken,
  sessionId: string,
  trackId: string
): Promise<void> {
  await test.step(`set track ${trackId} to play via api`, async () => {
    const res = await fetch(`${RPG_MAESTRO_URL}/maestro/sessions/${sessionId}/playing-tracks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken.token}`,
      },
      body: JSON.stringify({ currentTrack: { trackId, paused: false } }),
    });
    if (!res.ok) {
      throw new Error(`Failed to set track to play: ${res.status} ${res.statusText}`);
    }
  });
}
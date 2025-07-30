import { test } from '@playwright/test';
import { SessionID, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { FakeJwtToken, initUsersFixture } from '@rpg-maestro/test-utils';

export interface UserWithGeneratedSession {
  sessionId: SessionID;
  token: string;
  email: string;
}

export async function generateNewSession(fakeJwt: FakeJwtToken): Promise<UserWithGeneratedSession> {
  return await test.step('generate a new session with a new user', async () => {
    try {
      const response = await fetch(`http://localhost:8099/maestro/sessions`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Cookie: `CF_Authorization=${fakeJwt.token}`,
        },
      });
      if (!response.ok) {
        console.error(response.status, response.statusText);
        throw new Error('fetch failed for error: ' + response);
      }
      const sessionPlayingTracks = (await response.json()) as SessionPlayingTracks;
      console.info('debut gession: ', sessionPlayingTracks);
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
      const res = await fetch(`http://localhost:8099/maestro/sessions/${sessionId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `CF_Authorization=${jwtToken.token}`,
        },
        body: JSON.stringify({
          url: 'http://localhost:8099/public/race1.ogg',
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
    return initUsersFixture('http://localhost:8099');
  });
}
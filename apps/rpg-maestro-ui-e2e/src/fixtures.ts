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
        console.error(`POST /maestro/sessions failed for user: ${fakeJwt.email} ${response.status} ${response.statusText}, TODO remove: Bearer ${fakeJwt.token}`);
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
    return initUsersFixture(RPG_MAESTRO_URL);
  });
}
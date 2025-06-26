import { test } from '@playwright/test';
import { SessionID, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { generateRandomFakeJwtToken } from './utils/auth';

export interface GeneratedSession {
  sessionId: SessionID;
  token: string;
  email: string;
}

export async function generateNewSession(): Promise<GeneratedSession> {
  return await test.step('generate a new session with a new user', async () => {
    const fakeJwt = generateRandomFakeJwtToken();
    try {
      const response = await fetch(`http://localhost:8099/maestro/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `CF_Authorization=${fakeJwt.token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('UserAlreadyExistsError');
        }
        console.log(response.status, response.statusText);
        throw new Error('fetch failed for error: ' + response);
      }
      const sessionPlayingTracks = (await response.json()) as SessionPlayingTracks;
      const session = { sessionId: sessionPlayingTracks.sessionId, token: fakeJwt.token, email: fakeJwt.email };
      console.log("test session generated: ", session)
      return session;
    } catch (error) {
      console.error(error);
      return Promise.reject();
    }
  });
}

export async function iniTracksFromFileServerFixture(sessionId: string): Promise<void> {
  await test.step('init tracks from fileserver using api', async () => {
    try {
      const res = await fetch(`http://localhost:8099/maestro/sessions/${sessionId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'http://localhost:8099/public/race1.ogg',
        }),
      });
      if (!res.ok) {
        const error = new Error(`Failed to initialize tracks from fileserver for session ${sessionId}: ${res.status} ${res.statusText}`);
        console.error(error.message);
        throw error;
      } else {
        console.log("init tracks from fileserver using api ok for session: ", sessionId)
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  });
}

export interface FakeJwtToken {
  token: string;
  email: string;
}
export interface TestUsersFixture{
  an_admin_user: FakeJwtToken,
  a_maestro_user: FakeJwtToken,
}
export async function initUsersFixture(): Promise<TestUsersFixture>{
  return await test.step('init tracks from fileserver using api', async () => {
    try {
      const res = await fetch(`http://localhost:8099/test-utils/create-test-users-fixtures`, {
        method: 'GET',
      });
      if (!res.ok) {
        const error = new Error(`Failed to initialize users: ${res.status} ${res.statusText}`);
        console.error(error.message);
        throw error;
      } else {
        console.log("init users using api ok ")
        return (await res.json()) as TestUsersFixture;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

}
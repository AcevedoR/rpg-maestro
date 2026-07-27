import { expect, test } from '@playwright/test';
import {
  createTrackViaApi,
  generateNewSession,
  initUsersFixtureSpec,
  RPG_MAESTRO_URL,
  setTrackToPlayViaApi,
  UserWithGeneratedSession,
} from './fixtures';
import { simulateAuthenticatedInBrowser, waitForAppToBeReady } from './navigation';
import { TestUsersFixture } from '@rpg-maestro/test-utils';

// Run tests within this file serially to share one backend in-memory session without races
test.describe.configure({ mode: 'serial' });

let userFixture: TestUsersFixture;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await waitForAppToBeReady(page);
  userFixture = await initUsersFixtureSpec();
  await page.close();
});

test('the Players UI renders the audio player and a link back to the Maestro', async ({ page }) => {
  let user: UserWithGeneratedSession;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);
  });

  await test.step('go to player page (no auth required)', async () => {
    await page.goto(`/${user.sessionId}`);
    await expect(page.locator('h1')).toContainText('RPG-Maestro player UI');
  });

  await test.step('audio player is present on the page', async () => {
    await expect(page.locator('.rhap_container')).toBeVisible();
  });

  await test.step('link to the maestro interface is visible', async () => {
    await expect(page.getByText('Maestro interface is available here')).toBeVisible();
  });
});

test('the Players UI displays the track name when the Maestro sets a current track', async ({ page }) => {
  let user: UserWithGeneratedSession;
  let trackName: string;

  await test.step('prepare data: create a session and set a track to play', async () => {
    user = await generateNewSession(userFixture.a_maestro_B_user);

    const track = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'battle-theme-players-test',
    });
    trackName = track.name;
    await setTrackToPlayViaApi(user, user.sessionId, track.id);
  });

  await test.step('players page shows the track name in the audio player header', async () => {
    await page.goto(`/${user.sessionId}`);
    await expect(page.locator('h1')).toContainText('RPG-Maestro player UI');

    await expect(page.getByText('You are listening to:')).toBeVisible();
    await expect(page.getByText(trackName)).toBeVisible({ timeout: 5000 });
  });
});

test('the Players UI shows a Discord help link in error toasts when the API fails', async ({ page }) => {
  await test.step('force the session API to fail before the page loads', async () => {
    await page.route('**/sessions/**', (route) => route.fulfill({ status: 500, body: '{}' }));
  });

  await test.step('navigate to player page with a throwaway session id', async () => {
    await page.goto('/fake-session-for-error-toast-test');
  });

  await test.step('an error toast surfaces a Discord help link pointing to the invite', async () => {
    const discordLink = page.getByRole('alert').getByRole('link', { name: /get help in our discord/i });
    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute('href', 'https://discord.gg/e4cvXZc3bZ');
    // the icon is decorative (no accessible name), so scope a structural query to the link
    await expect(discordLink.locator('svg')).toBeVisible();
  });
});

test('the Players UI stops polling and explains itself when the session does not exist', async ({ page }) => {
  const playingTracksUrl = '**/sessions/*/playing-tracks';
  let requestCount = 0;

  await test.step('make the session API report the session as missing, before the page loads', async () => {
    await page.route(playingTracksUrl, (route) => {
      requestCount++;
      return route.fulfill({ status: 404, body: JSON.stringify({ message: 'Session not found' }) });
    });
  });

  await test.step('navigate to a player page for a session that does not exist', async () => {
    await page.goto('/session-that-does-not-exist');
    await expect(page.locator('h1')).toContainText('RPG-Maestro player UI');
  });

  await test.step('the page explains that the session does not exist', async () => {
    await expect(
      page.getByText(
        "Session 'session-that-does-not-exist' does not exist. Double-check the link your Maestro shared with you."
      )
    ).toBeVisible();
  });

  await test.step('a missing session is not reported as a fetch failure', async () => {
    // role="alert" is react-toastify's; the panel above deliberately uses role="status" so that this
    // asserts no toast fired at all, rather than trivially matching the panel's own text.
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  await test.step('the sync loop is stopped, so no further request is made', async () => {
    // Asserting the *absence* of a request needs a bounded wait: waitForRequest rejects on timeout,
    // which is the assertion. 3s spans three would-be sync ticks (SYNC_TRACK_INTERVAL_MS = 1000).
    const countWhenGivingUp = requestCount;
    const polledAgain = await page
      .waitForRequest(playingTracksUrl, { timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    expect(polledAgain).toBe(false);
    // it takes CONSECUTIVE_NOT_FOUND_BEFORE_GIVING_UP strikes to give up, and not one more after
    expect(requestCount).toBe(countWhenGivingUp);
    expect(countWhenGivingUp).toBe(3);
  });
});

test('the Players UI recovers from a transient 404 instead of declaring the session gone', async ({ page }) => {
  let user: UserWithGeneratedSession;
  let trackName: string;

  await test.step('prepare data: a real session with a track playing', async () => {
    user = await generateNewSession(userFixture.a_maestro_B_user);
    const track = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'transient-404-recovery-test',
    });
    trackName = track.name;
    await setTrackToPlayViaApi(user, user.sessionId, track.id);
  });

  await test.step('serve a single 404 — as an ingress would mid-deploy — then let requests through', async () => {
    let served404 = false;
    await page.route('**/sessions/*/playing-tracks', async (route) => {
      if (!served404) {
        served404 = true;
        return route.fulfill({ status: 404, body: JSON.stringify({ message: 'Session not found' }) });
      }
      return route.fallback();
    });
  });

  await test.step('one 404 is below the give-up threshold, so the player still syncs', async () => {
    await page.goto(`/${user.sessionId}`);
    await expect(page.getByText(trackName)).toBeVisible();
    await expect(page.getByText(/does not exist/)).toHaveCount(0);
  });
});

test('the Players UI updates the displayed track name when the Maestro changes the track', async ({ page }) => {
  let user: UserWithGeneratedSession;
  let firstTrackName: string;
  let secondTrackName: string;
  let firstTrackId: string;
  let secondTrackId: string;

  await test.step('prepare data: two tracks, first one playing', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);

    const first = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'first-track-sync-test',
    });
    firstTrackName = first.name;
    firstTrackId = first.id;

    const second = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'second-track-sync-test',
    });
    secondTrackName = second.name;
    secondTrackId = second.id;

    await setTrackToPlayViaApi(user, user.sessionId, firstTrackId);
  });

  await test.step('player page shows first track', async () => {
    await page.goto(`/${user.sessionId}`);
    await expect(page.getByText(firstTrackName)).toBeVisible({ timeout: 5000 });
  });

  await test.step('maestro switches to second track via API', async () => {
    await setTrackToPlayViaApi(user, user.sessionId, secondTrackId);
  });

  await test.step('player page automatically syncs to the second track', async () => {
    await expect(page.getByText(secondTrackName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(firstTrackName)).not.toBeVisible();
  });
});

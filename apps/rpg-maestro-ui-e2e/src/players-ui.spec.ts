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

import { expect, test } from '@playwright/test';
import {
  createTrackViaApi,
  generateNewSession,
  initUsersFixtureSpec,
  RPG_MAESTRO_URL,
  UserWithGeneratedSession,
} from './fixtures';
import { goToMaestroPage, simulateAuthenticatedInBrowser, waitForAppToBeReady } from './navigation';
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

test('a Maestro can filter tracks by quick tag (single click)', async ({ page }) => {
  let user: UserWithGeneratedSession;
  let combatTrackName: string;
  let travelTrackName: string;

  await test.step('prepare data: create two tracks with different tags', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);

    const combatTrack = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'combat-track-test',
      tags: ['combat'],
    });
    combatTrackName = combatTrack.name;

    const travelTrack = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'travel-track-test',
      tags: ['travel'],
    });
    travelTrackName = travelTrack.name;
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToMaestroPage(page, user.sessionId);

  await test.step('both tracks are visible before filtering', async () => {
    await expect(page.locator('.MuiDataGrid-row', { hasText: combatTrackName })).toBeVisible();
    await expect(page.locator('.MuiDataGrid-row', { hasText: travelTrackName })).toBeVisible();
  });

  await test.step('single click on "combat" quick tag filters tracks table', async () => {
    await page.locator('button', { hasText: 'combat' }).click();
    await expect(page.locator('.MuiDataGrid-row', { hasText: combatTrackName })).toBeVisible();
    await expect(page.locator('.MuiDataGrid-row', { hasText: travelTrackName })).not.toBeVisible();
  });
});

test('a Maestro can search for a specific track by name', async ({ page }) => {
  let user: UserWithGeneratedSession;
  let trackAName: string;
  let trackBName: string;

  await test.step('prepare data: create two tracks', async () => {
    user = await generateNewSession(userFixture.a_maestro_B_user);

    const trackA = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'dragon-theme-unique',
    });
    trackAName = trackA.name;

    const trackB = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'tavern-ambience-unique',
    });
    trackBName = trackB.name;
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToMaestroPage(page, user.sessionId);

  await test.step('both tracks are visible in the table', async () => {
    await expect(page.locator('.MuiDataGrid-row', { hasText: trackAName })).toBeVisible();
    await expect(page.locator('.MuiDataGrid-row', { hasText: trackBName })).toBeVisible();
  });

  await test.step('searching by name filters the tracks table', async () => {
    const searchInput = page.getByRole('combobox', { name: 'Search specific track' });
    await searchInput.click();
    await searchInput.fill(trackAName);
    await page.getByRole('option', { name: trackAName }).click();

    await expect(page.locator('.MuiDataGrid-row', { hasText: trackAName })).toBeVisible();
    await expect(page.locator('.MuiDataGrid-row', { hasText: trackBName })).not.toBeVisible();
  });
});

test('a Maestro can open the track edit form and update the track name', async ({ page }) => {
  let user: UserWithGeneratedSession;
  let trackName: string;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);

    const track = await createTrackViaApi(user, user.sessionId, {
      url: `${RPG_MAESTRO_URL}/public/race1.ogg`,
      name: 'track-to-edit',
    });
    trackName = track.name;
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToMaestroPage(page, user.sessionId);

  await test.step('open the edit form for the track', async () => {
    const row = page.locator('.MuiDataGrid-row', { hasText: trackName });
    await expect(row).toBeVisible();

    await row.hover();

    // The Edit action may be inline or in the "..." overflow menu
    const moreActionsButton = row.getByRole('button', { name: 'More actions' });
    if (await moreActionsButton.isVisible()) {
      await moreActionsButton.click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
    } else {
      await row.getByRole('menuitem', { name: 'Edit' }).click();
    }
  });

  await test.step('edit drawer opens with the track name pre-filled', async () => {
    await expect(page.getByRole('heading', { name: /Update track/i })).toBeVisible();
    await expect(page.getByLabel('Name (optional)')).toHaveValue(trackName);
  });

  await test.step('update the track name', async () => {
    const newName = 'renamed-track-e2e';
    await page.getByLabel('Name (optional)').fill(newName);
    await page.getByRole('button', { name: 'Update track' }).click();

    await expect(page.getByRole('heading', { name: /Update track/i })).not.toBeVisible();
    await expect(page.locator('.MuiDataGrid-row', { hasText: newName })).toBeVisible();
  });
});

test('a Maestro can navigate from soundboard to tracks management', async ({ page }) => {
  let user: UserWithGeneratedSession;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_B_user);
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToMaestroPage(page, user.sessionId);

  await test.step('click "Manage your tracks" link and reach tracks management page', async () => {
    await page.getByText('Manage your tracks').click();
    await expect(page.locator('h1')).toContainText('Tracks management');
    expect(page.url()).toContain(`/maestro/manage/${user.sessionId}`);
  });
});

test('a Maestro can navigate from soundboard to the player view', async ({ page }) => {
  let user: UserWithGeneratedSession;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToMaestroPage(page, user.sessionId);

  await test.step('click "see what your players are seeing" link', async () => {
    await page.getByText('see what your players are seeing').click();
    await expect(page.locator('h1')).toContainText('RPG-Maestro player UI');
    expect(page.url()).toContain(`/${user.sessionId}`);
  });
});

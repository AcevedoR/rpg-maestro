import { expect, test } from '@playwright/test';
import { generateNewSession, initUsersFixtureSpec, RPG_MAESTRO_URL, UserWithGeneratedSession } from './fixtures';
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

async function goToTracksManagement(page: import('@playwright/test').Page, sessionId: string) {
  await page.goto(`/maestro/manage/${sessionId}`);
  await expect(page.locator('h1')).toContainText('Tracks management');
}

test('the Create track form shows a validation error when URL is too short', async ({ page }) => {
  let user: UserWithGeneratedSession;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToTracksManagement(page, user.sessionId);

  await test.step('entering a too-short URL shows a validation error and disables the submit button', async () => {
    // The form validates when inputUrl.length < 3 or inputUrl is null
    await page.getByLabel('URL').fill('ht');

    await expect(page.getByText('valid URL is required')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create track' })).toBeDisabled();
  });
});

test('a Maestro can create a track with a name and tags', async ({ page }) => {
  let user: UserWithGeneratedSession;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_B_user);
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToTracksManagement(page, user.sessionId);

  await test.step('fill the form with URL, name, and tags', async () => {
    await page.getByLabel('URL').fill(`${RPG_MAESTRO_URL}/public/race1.ogg`);
    await page.getByLabel('Name (optional)').fill('my-named-track-e2e');

    await page.getByLabel('Tags (optional)').click();
    await page.getByLabel('Tags (optional)').fill('forest');
    await page.keyboard.press('Enter');
  });

  await test.step('submit the form and see success toast', async () => {
    await page.getByRole('button', { name: 'Create track' }).click();
    await expect(page.getByText(/Track created/i)).toBeVisible({ timeout: 10000 });
  });

  await test.step('new track appears on the maestro soundboard', async () => {
    await page.goto(`/maestro/${user.sessionId}`);
    await expect(page.locator('h1')).toContainText('Maestro UI');
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'my-named-track-e2e' })).toBeVisible();
  });
});

test('a Maestro can navigate back to the soundboard from tracks management', async ({ page }) => {
  let user: UserWithGeneratedSession;

  await test.step('prepare data', async () => {
    user = await generateNewSession(userFixture.a_maestro_user);
  });

  await simulateAuthenticatedInBrowser(page, user);
  await goToTracksManagement(page, user.sessionId);

  await test.step('click "Go back to Maestro ui" and reach the soundboard', async () => {
    await page.getByText('Go back to Maestro ui').click();
    await expect(page.locator('h1')).toContainText('Maestro UI');
    expect(page.url()).toContain(`/maestro/${user.sessionId}`);
  });
});

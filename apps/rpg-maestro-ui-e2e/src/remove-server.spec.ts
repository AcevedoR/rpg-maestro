import { expect, Page, test } from '@playwright/test';
import { generateNewSession, initUsersFixtureSpec, RPG_MAESTRO_URL, UserWithGeneratedSession } from './fixtures';
import { goToMaestroPage, simulateAuthenticatedInBrowser, waitForAppToBeReady } from './navigation';

test('a Maestro can add a new track located on a remote server', async ({ page }) => {
  let user: UserWithGeneratedSession;
  await test.step('prepare data', async () => {
    await waitForAppToBeReady(page);
    const userFixture = await initUsersFixtureSpec();
    user = await generateNewSession(userFixture.a_maestro_user);
  });

  await simulateAuthenticatedInBrowser(page, user);

  await test.step('go to Tracks management and add a track', async () => {
    await goToTracksManagement(page, user.sessionId);
    await page.getByLabel('URL').fill(`${RPG_MAESTRO_URL}/public/light-switch-sound-198508.mp3`);
    await page.getByText('CREATE TRACK').click();
    await expect(page.getByText('CREATE TRACK')).toBeEnabled();
  });

  await test.step('track should be available on Maestro UI', async () => {
    await goToMaestroPage(page, user.sessionId);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'light-switch-sound-198508' })).toBeVisible();
  });
});

async function goToTracksManagement(page: Page, sessionId: string) {
  await page.goto(`/maestro/manage/${sessionId}`);
  expect(await page.locator('h1').innerText()).toContain('Tracks management');
}

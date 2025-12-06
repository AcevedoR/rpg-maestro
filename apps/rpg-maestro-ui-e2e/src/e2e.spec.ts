import { expect, test } from '@playwright/test';
import {
  generateNewSession,
  iniTracksFromFileServerFixture,
  initUsersFixtureSpec,
  UserWithGeneratedSession,
} from './fixtures';
import { goToMaestroPage, simulateAuthenticatedInBrowser, waitForAppToBeReady } from './navigation';

test('health check works', async ({ page }) => {
  await expect(waitForAppToBeReady(page)).resolves.not.toThrow();
});

test('a Maestro can load (via API) and play a current track for its players', async ({ page }) => {
  let user: UserWithGeneratedSession;
  await test.step('prepare data', async () => {
    await waitForAppToBeReady(page)
    const userFixture = await initUsersFixtureSpec();
    user = await generateNewSession(userFixture.a_maestro_user);
    await iniTracksFromFileServerFixture(user, user.sessionId);
  });

  await simulateAuthenticatedInBrowser(page, user);

  await test.step('go to maestro page, and list available tracks', async () => {
    await goToMaestroPage(page, user.sessionId);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'race1' })).toBeVisible();
  });

  await test.step('set "race1" track to current track', async () => {
    await page.getByText('race1').click();
  });

  await test.step('go to players page, current track should be displayed', async () => {
    await page.goto(`/${user.sessionId}`);
    expect(await page.locator('h1').innerText()).toContain('RPG-Maestro player UI');
    await expect(page.getByText('race1')).toBeVisible();
  });
});



import { expect, Page, test } from '@playwright/test';
import {
  UserWithGeneratedSession,
  generateNewSession,
  iniTracksFromFileServerFixture,
  initUsersFixtureSpec
} from './fixtures';
import { goToMaestroPage, waitForAppToBeReady } from './navigation';
import { FakeJwtToken } from '@rpg-maestro/test-utils';


test('a Maestro can load (via API) and play a current track for its players', async ({ page }) => {
  let user: UserWithGeneratedSession;
  await test.step('prepare data', async () => {
    await waitForAppToBeReady(page)
    user = await generateNewSession((await initUsersFixtureSpec()).a_maestro_user);
    await iniTracksFromFileServerFixture(user, user.sessionId);
  });

  await simulateAuth(page, user);

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

test('a Maestro can add a new track located on a remote server', async ({ page }) => {
  let user: UserWithGeneratedSession;
  await test.step('prepare data', async () => {
    await waitForAppToBeReady(page)
    user = await generateNewSession((await initUsersFixtureSpec()).a_maestro_user);
  });

  await simulateAuth(page, user);

  await test.step('go to Tracks management and add a track', async () => {
    await goToTracksManagement(page, user.sessionId);
    await page.getByLabel('URL').fill('http://localhost:8099/public/light-switch-sound-198508.mp3');
    await page.getByText('CREATE TRACK').click();
    await expect(page.getByText('CREATE TRACK')).toBeEnabled();
  });

  await test.step('track should be available on Maestro UI', async () => {
    await goToMaestroPage(page, user.sessionId);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'light-switch-sound-198508' })).toBeVisible();
  })
});

async function goToTracksManagement(page: Page, sessionId: string) {
  await page.goto(`/maestro/manage/${sessionId}`);
  expect(await page.locator('h1').innerText()).toContain('Tracks management');
}

async function simulateAuth(page: Page, fakeJwtToken: FakeJwtToken) {
  await test.step('simulate login in', async () => {
    await page.context().addCookies([
      {
        name: 'CF_Authorization',
        value: fakeJwtToken.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  });
}

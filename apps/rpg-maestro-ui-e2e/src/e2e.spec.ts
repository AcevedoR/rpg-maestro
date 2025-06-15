import { expect, Page, test } from '@playwright/test';
import { iniTracksFromFileServerFixture } from './fixtures';
import { goToMaestroPage } from './navigation';

async function goToTracksManagement(page: Page, sessionId: string) {
  await page.goto(`/maestro/manage/${sessionId}`);
  expect(await page.locator('h1').innerText()).toContain('Tracks management');
}

const A_SESSION_ID = 'a-session';

test('a Maestro can load (via API) and play a current track for its players', async ({ page }) => {

  await iniTracksFromFileServerFixture(A_SESSION_ID)

  await test.step('go to maestro page, and list available tracks', async () => {
    await goToMaestroPage(page, A_SESSION_ID);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'race1' })).toBeVisible();
  });

  await test.step('set "race1" track to current track', async () => {
    await page.getByText('race1').click();
  });

  await test.step('go to players page, current track should be displayed', async () => {
    await page.goto(`/${A_SESSION_ID}`);
    expect(await page.locator('h1').innerText()).toContain('RPG-Maestro player UI');
    await expect(page.getByText('race1')).toBeVisible();
  });
});

test('a Maestro can add a new track located on a remote server', async ({ page }) => {
  await test.step('go to Tracks management and add a track', async () => {
    await goToTracksManagement(page, A_SESSION_ID);
    await page.getByLabel('URL').fill('http://localhost:8099/public/light-switch-sound-198508.mp3');
    await page.getByText('CREATE TRACK').click();
    await expect(page.getByText('CREATE TRACK')).toBeEnabled();
  });

  await test.step('track should be available on Maestro UI', async () => {
    await goToMaestroPage(page, A_SESSION_ID);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'light-switch-sound-198508' })).toBeVisible();
  });
});

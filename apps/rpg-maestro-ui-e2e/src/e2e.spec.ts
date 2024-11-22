import { expect, Page, test } from '@playwright/test';

async function goToAdmin(page: Page) {
  await page.goto('/admin');
  expect(await page.locator('h1').innerText()).toContain('Admin UI');
}
async function goToTracksManagement(page: Page) {
  await page.goto('/admin/manage');
  expect(await page.locator('h1').innerText()).toContain('Tracks management');
}

test('a Maestro can load (via API) and play a current track for its players', async ({ page }) => {
  await test.step('init tracks from fileserver using api', async () => {
    try {
      const res = await fetch('http://localhost:8099/admin/tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'http://localhost:8099/public/race1.ogg',
        }),
      });
      if (!res.ok) {
        console.error(res);
        test.fail();
      }
    } catch (err) {
      console.error(err);
      test.fail();
    }
  });

  await test.step('go to admin page, and list available tracks', async () => {
    await goToAdmin(page);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'race1' })).toBeVisible();
  });

  await test.step('set "race1" track to current track', async () => {
    await page.getByText('race1').click();
  });

  await test.step('go to players page, current track should be displayed', async () => {
    await page.goto('/');
    expect(await page.locator('h1').innerText()).toContain('RPG-Maestro player UI');
    await expect(page.getByText('race1')).toBeVisible();
  });
});

test('a Maestro can add a new track located on a remote server', async ({ page }) => {

  await test.step('go to Tracks management and add a track', async () => {
    await goToTracksManagement(page);
    await page.getByLabel('URL').fill('http://localhost:8099/public/light-switch-sound-198508.mp3');
    await page.getByText('CREATE TRACK').click();
    await expect(page.getByText('CREATE TRACK')).toBeEnabled();
  });

  await test.step('track should be available on Admin UI', async () => {
    await goToAdmin(page);
    await expect(page.locator('.MuiDataGrid-row', { hasText: 'light-switch-sound-198508' })).toBeVisible();
  });
});

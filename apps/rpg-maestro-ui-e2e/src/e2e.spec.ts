import { expect, test } from '@playwright/test';

test('a Maestro can load and play a current track for its players', async ({ page }) => {
  await test.step('init tracks from fileserver', async () => {
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
    await page.goto('/admin');
    expect(await page.locator('h1').innerText()).toContain('Admin UI');
    expect(await page.locator('.MuiDataGrid-row').innerText()).toContain('race1');
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

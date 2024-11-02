import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  try{
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
  }catch(err){
    console.error(err);
    test.fail();
  }

  await page.goto('/admin');

  expect(await page.locator('h1').innerText()).toContain('Admin UI');
  expect(await page.locator('.MuiDataGrid-row').innerText()).toContain('race1');
});

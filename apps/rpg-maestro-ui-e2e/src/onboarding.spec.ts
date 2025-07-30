import { expect, test } from '@playwright/test';

test.use({
  storageState: undefined,
  httpCredentials: undefined,
  contextOptions: {
    storageState: undefined,
  },
});

test('a new User can become a Maestro and have his own session', async ({ page }) => {

  await test.step('go to onboarding page, and read onboarding instructions', async () => {

    await page.goto(`/onboarding`);
    await expect(page.getByRole('heading', { name: 'Welcome to RPG-MAESTRO!' })).toBeVisible();
  });

  await test.step('create an account', async () => {
    await page.getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'This is a fake IDP login page' })).toBeVisible();
  });

  await test.step('get redirected to session setup page after IDP auth', async () => {
    await page.getByRole('button', {name: 'Log as a new user'}).click();
    await expect(page.getByRole('heading', { name: 'Account created!' })).toBeVisible();
    await expect(page.getByText('Share this link to your Players so they can join your session')).toBeVisible();
    await page.getByRole('link', { name: 'Enter your Maestro Session' }).click();
    await expect(page.getByRole('heading', { name: 'Maestro UI' })).toBeVisible();
  });

  await test.step('a track should be playing', async () => {
    await expect(page.getByText('No tracks selected to play')).toBeHidden();
    const audio = page.locator('audio');
    // Wait until the audio element is ready and has a source
    await expect.poll(async () => {
      return await audio.evaluate((el: HTMLAudioElement) => el.readyState >= 2 && el.src !== '');
    }, {
      timeout: 5000
    }).toBe(true);
  });

});

// test('cannot access maestro page if not logged', async ({ page }) => {
//   await test.step('go to a session link as a player, unauthenticated', async () => {
//   });
//   await test.step('cannot access maestro page without being logged', async () => {
//   });
// });
// test('cannot access maestro page if not linked to session', async ({ page }) => {
//   await test.step('go to a session link as a Maestro, but not on a permitted session', async () => {
//   })
//   await test.step('get to an unauthorized error page', async () => {
//   });
// })
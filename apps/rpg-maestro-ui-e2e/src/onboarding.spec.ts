import { expect, test } from '@playwright/test';
import { iniTracksFromFileServerFixture } from './fixtures';

const A_SESSION_ID = 'a-new-session';

test('a new User can become a Maestro and have his own session', async ({ page }) => {

  await iniTracksFromFileServerFixture(A_SESSION_ID)

  await test.step('go to onboarding page, and read onboarding instructions', async () => {
    await page.goto(`/onboarding`);
    await expect(page.getByRole('heading', { name: 'Welcome to RPG-MAESTRO!' })).toBeVisible();
  });

  await test.step('create an account', async () => {
    await page.getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'This is a fake IDP login page' })).toBeVisible();
  });

  await test.step('get redirected to session setup page after IDP auth', async () => {
    await page.getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Account created!' })).toBeVisible();
    //   // have your id display
    //   // have your session link displayed
  });
  
  // await test.step('go to Maestro page, and list available tracks', async () => {
  // });
  // await test.step('set "race1" track to current track', async () => {
  // });
  // await test.step('go to players page, current track should be displayed', async () => {
  // });
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
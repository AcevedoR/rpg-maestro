import { expect, test } from '@playwright/test';
import { LandingEventsDailyCount } from '@rpg-maestro/rpg-maestro-api-contract';
import { initUsersFixtureSpec, RPG_MAESTRO_URL } from './fixtures';

test.use({
  storageState: undefined,
  httpCredentials: undefined,
  contextOptions: {
    storageState: undefined,
  },
});

test('a visitor can start free from the landing page and reach a working session', async ({ page }) => {
  await test.step('visit the landing page with a source slug, pricing is visible', async () => {
    await page.goto('/?src=e2e-start-free');
    await expect(
      page.getByRole('heading', { name: 'Your players hear your music too. One link, no setup.' })
    ).toBeVisible();
    await expect(page.getByText('founding members keep $3/month forever')).toBeVisible();
    await page.getByRole('tab', { name: 'Pricing' }).click();
    await expect(page.getByRole('columnheader', { name: 'Maestro — $4/month' })).toBeVisible();
  });

  await test.step('click Start free and go through onboarding', async () => {
    await page.getByRole('button', { name: 'Start free →' }).first().click();
    await expect(page.getByRole('heading', { name: 'Your soundboard is one sign-in away' })).toBeVisible();
    await page.getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'This is a fake IDP login page' })).toBeVisible();
    await page.getByRole('button', { name: 'Log as a new user' }).click();
  });

  await test.step('a session exists and is shareable', async () => {
    await expect(page.getByRole('heading', { name: 'Account created!' })).toBeVisible();
    await expect(page.getByText('Share this link to your Players so they can join your session')).toBeVisible();
  });

  await test.step('the funnel events were recorded with the source slug', async () => {
    const users = await initUsersFixtureSpec();
    // the beacons are fire-and-forget, so poll until both events are counted
    await expect
      .poll(async () => {
        const response = await fetch(`${RPG_MAESTRO_URL}/landing-events`, {
          headers: { Authorization: `Bearer ${users.an_admin_user.token}` },
        });
        if (!response.ok) {
          return [];
        }
        const counts = (await response.json()) as LandingEventsDailyCount[];
        return counts
          .filter((c) => c.source === 'e2e-start-free' && c.count >= 1)
          .map((c) => c.type)
          .sort();
      })
      .toEqual(['session_created', 'start_free_clicked']);
  });
});

test('the Maestro paid tier is greyed out and marked as coming soon', async ({ page }) => {
  await test.step('open the Pricing tab', async () => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Pricing' }).click();
  });

  await test.step('the upgrade button is disabled and the paid column is marked coming soon', async () => {
    await expect(page.getByRole('button', { name: 'Maestro $4/mo' })).toBeDisabled();
    await expect(page.getByRole('columnheader', { name: 'Maestro — $4/month coming soon' })).toBeVisible();
  });
});

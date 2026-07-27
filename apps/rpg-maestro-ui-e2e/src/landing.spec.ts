import { expect, test } from '@playwright/test';
import { LandingEventsDailyCount, UpgradeInterest } from '@rpg-maestro/rpg-maestro-api-contract';
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
    await expect(page.getByRole('columnheader', { name: 'Maestro — $4/month' })).toBeVisible();
    await expect(page.getByText('founding members keep $3/month forever')).toBeVisible();
  });

  await test.step('click Start free and go through onboarding', async () => {
    await page.getByRole('button', { name: 'Start free →' }).first().click();
    await expect(page.getByRole('heading', { name: 'Welcome to RPG-MAESTRO!' })).toBeVisible();
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

test('a visitor can reserve the founding price from the upgrade modal', async ({ page }) => {
  const email = `landing-e2e-${Date.now()}@example.com`;

  await test.step('visit the landing page and open the upgrade modal', async () => {
    await page.goto('/?src=e2e-upgrade');
    await page.getByRole('button', { name: 'Maestro $4/mo' }).click();
    await expect(page.getByRole('heading', { name: 'Maestro opens soon' })).toBeVisible();
  });

  await test.step('submit an email', async () => {
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Reserve founding price' }).click();
    await expect(page.getByRole('status')).toHaveText("Founding price reserved — we'll email you when Maestro opens.");
  });

  await test.step('the upgrade interest is persisted with its source and had_session marker', async () => {
    const users = await initUsersFixtureSpec();
    const response = await fetch(`${RPG_MAESTRO_URL}/upgrade-interest`, {
      headers: { Authorization: `Bearer ${users.an_admin_user.token}` },
    });
    expect(response.ok).toBe(true);
    const upgradeInterests = (await response.json()) as UpgradeInterest[];
    const row = upgradeInterests.find((u) => u.email === email);
    expect(row).toBeDefined();
    expect(row?.source).toBe('e2e-upgrade');
    expect(row?.had_session).toBe(false);
  });
});

test('a visitor sees an error and can retry when the upgrade-interest submission fails', async ({ page }) => {
  await test.step('visit the landing page with a failing upgrade-interest backend', async () => {
    await page.route('**/upgrade-interest', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/');
  });

  await test.step('submitting an email shows an error toast and keeps the form', async () => {
    await page.getByRole('button', { name: 'Maestro $4/mo' }).click();
    await page.getByLabel('Email').fill('gm@example.com');
    await page.getByRole('button', { name: 'Reserve founding price' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

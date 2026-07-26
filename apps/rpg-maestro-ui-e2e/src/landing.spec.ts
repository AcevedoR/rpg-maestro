import { expect, test } from '@playwright/test';
import { BetaSignup } from '@rpg-maestro/rpg-maestro-api-contract';
import { initUsersFixtureSpec, RPG_MAESTRO_URL } from './fixtures';

test.use({
  storageState: undefined,
  httpCredentials: undefined,
  contextOptions: {
    storageState: undefined,
  },
});

test('a visitor can sign up for the beta from the landing page', async ({ page }) => {
  const email = `landing-e2e-${Date.now()}@example.com`;

  await test.step('visit the landing page with a source slug, pricing is visible', async () => {
    await page.goto('/?src=e2e-test');
    await expect(
      page.getByRole('heading', { name: 'Your players hear your music too. One link, no setup.' })
    ).toBeVisible();
    await expect(page.getByText('$4/month at launch').first()).toBeVisible();
  });

  await test.step('submit an email in the hero form', async () => {
    await page.getByLabel('Email').first().fill(email);
    await page.getByRole('button', { name: 'Get early access →' }).first().click();
    await expect(page.getByRole('status').first()).toHaveText(
      "You're on the list! We'll email you when your seat at the table opens."
    );
  });

  await test.step('the signup is persisted with its source', async () => {
    const users = await initUsersFixtureSpec();
    const response = await fetch(`${RPG_MAESTRO_URL}/beta-signups`, {
      headers: { Authorization: `Bearer ${users.an_admin_user.token}` },
    });
    expect(response.ok).toBe(true);
    const signups = (await response.json()) as BetaSignup[];
    const signup = signups.find((s) => s.email === email);
    expect(signup).toBeDefined();
    expect(signup?.source).toBe('e2e-test');
  });
});

test('a visitor sees an error and can retry when the signup fails', async ({ page }) => {
  await test.step('visit the landing page with a failing signup backend', async () => {
    await page.route('**/beta-signups', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/');
  });

  await test.step('submitting an email shows an error toast and keeps the form', async () => {
    await page.getByLabel('Email').first().fill('gm@example.com');
    await page.getByRole('button', { name: 'Get early access →' }).first().click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Email').first()).toBeVisible();
  });
});

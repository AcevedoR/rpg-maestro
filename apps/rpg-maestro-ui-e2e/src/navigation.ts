import test, { expect, Page } from '@playwright/test';
import { FakeJwtToken } from '@rpg-maestro/test-utils';

export async function waitForAppToBeReady(page: Page) {
  await page.goto('/health');
  await expect(page.getByText('server status: ok')).toBeVisible({timeout: 15000});
}

export async function goToMaestroPage(page: Page, sessionId: string) {
  await page.goto(`/maestro/${sessionId}`);
  expect(await page.locator('h1').innerText()).toContain('Maestro UI');
}

export async function simulateAuthenticatedInBrowser(page: Page, user: FakeJwtToken) {
  await test.step('simulate login in', async () => {
    await page.context().addCookies([
      {
        name: 'FAKE_TOKEN',
        value: user.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  });
}

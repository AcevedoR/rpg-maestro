import { expect, Page } from '@playwright/test';

export async function waitForAppToBeReady(page: Page) {
  await page.goto('/health');
  await expect(page.getByText('server status: ok')).toBeVisible({timeout: 15000});
}

export async function goToMaestroPage(page: Page, sessionId: string) {
  await page.goto(`/maestro/${sessionId}`);
  expect(await page.locator('h1').innerText()).toContain('Maestro UI');
}

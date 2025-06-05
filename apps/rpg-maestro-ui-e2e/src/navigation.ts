import { expect, Page } from '@playwright/test';

export async function goToMaestroPage(page: Page, sessionId: string) {
  await page.goto(`/maestro/${sessionId}`);
  expect(await page.locator('h1').innerText()).toContain('Maestro UI');
}

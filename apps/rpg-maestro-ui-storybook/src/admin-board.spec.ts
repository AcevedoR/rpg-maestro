import { expect, test } from '@playwright/test';

const storybookUrl = process.env.STORYBOOK_URL || 'http://localhost:6006';

test('admin board sorts updated_at with March dates', async ({ page }) => {
  const march9 = Date.UTC(2026, 2, 9, 12, 0, 0, 0);
  const march13 = Date.UTC(2026, 2, 13, 12, 0, 0, 0);

  await page.addInitScript(
    ({ march9, march13 }) => {
      const original = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        const time = this.valueOf();
        if (options?.month === 'short' && options?.day === 'numeric') {
          if (time === march9) {
            return '9 March';
          }
          if (time === march13) {
            return '13 March';
          }
        }
        return original.call(this, locales as never, options as never);
      };
    },
    { march9, march13 }
  );

  await page.goto(`${storybookUrl}/?path=/story/admin-adminboard--default`);

  const frame = page.frameLocator('#storybook-preview-iframe');
  // the board opens on the Overview tab; the users grid lives behind the Users tab
  await frame.getByRole('tab', { name: 'Users' }).click();
  // every tab's grid stays mounted (hidden), so locators must be scoped to the visible one
  const grid = frame.locator('.MuiDataGrid-root').filter({ visible: true });
  const updatedHeader = grid.locator('[role="columnheader"][data-field="updated_at"]');
  await expect(updatedHeader).toBeVisible({ timeout: 30000 });
  await expect(updatedHeader).toHaveAttribute('aria-sort', 'ascending');

  const rows = grid.locator('.MuiDataGrid-row[data-id]');
  const march9Row = grid.locator('.MuiDataGrid-row[data-id="minstrel|005"]');
  const march13Row = grid.locator('.MuiDataGrid-row[data-id="maestro|004"]');

  await expect(rows.first()).toBeVisible();
  await expect(march9Row).toContainText('9 March');
  await expect(march13Row).toContainText('13 March');

  await expect
    .poll(async () => {
      const march9Index = Number(await march9Row.getAttribute('data-rowindex'));
      const march13Index = Number(await march13Row.getAttribute('data-rowindex'));
      if (Number.isNaN(march9Index) || Number.isNaN(march13Index)) {
        return false;
      }
      return march9Index < march13Index;
    })
    .toBe(true);
});

test('admin board opens on a live overview of sessions, GMs and listeners', async ({ page }) => {
  // the full-viewport story URL: docked in the manager, the grid body is too short to render rows
  await page.goto(`${storybookUrl}/iframe.html?id=admin-adminboard--default&viewMode=story`);

  await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');

  // the Sessions tab's hidden grid reuses the same session ids, so scope to the visible grid
  const grid = page.locator('.MuiDataGrid-root').filter({ visible: true });
  // most-listened session first: the grid default-sorts on listener count, descending
  const listenersHeader = grid.locator('[role="columnheader"][data-field="connectedPlayers"]');
  await expect(listenersHeader).toBeVisible({ timeout: 30000 });
  await expect(listenersHeader).toHaveAttribute('aria-sort', 'descending');

  const epsilonRow = grid.locator('.MuiDataGrid-row[data-id="session-epsilon"]');
  await expect(epsilonRow).toHaveAttribute('data-rowindex', '0');
  await expect(epsilonRow).toContainText('playing');
  await expect(epsilonRow).toContainText('Smoldering Ruins');
  await expect(epsilonRow).toContainText('admin|008');
  await expect(epsilonRow).toContainText('10');

  const idleRow = grid.locator('.MuiDataGrid-row[data-id="session-gamma"]');
  await expect(idleRow).toContainText('idle');
  await expect(idleRow).toContainText('maestro|002');
});

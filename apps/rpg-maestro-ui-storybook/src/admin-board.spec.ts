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
  const updatedHeader = frame.locator('[role="columnheader"][data-field="updated_at"]');
  await expect(updatedHeader).toBeVisible();
  await expect(updatedHeader).toHaveAttribute('aria-sort', 'ascending');

  const rows = frame.locator('.MuiDataGrid-row[data-id]');
  const march9Row = frame.locator('.MuiDataGrid-row[data-id="minstrel|005"]');
  const march13Row = frame.locator('.MuiDataGrid-row[data-id="maestro|004"]');

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

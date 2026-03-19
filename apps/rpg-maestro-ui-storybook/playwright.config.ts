import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

import { workspaceRoot } from '@nx/devkit';

const storybookUrl = process.env['STORYBOOK_URL'] || 'http://localhost:6006';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL: storybookUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run storybook',
    url: storybookUrl,
    reuseExistingServer: !process.env.CI,
    cwd: workspaceRoot,
    stderr: 'pipe',
    stdout: 'pipe',
  },
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], process.env.CI ? ['github'] : ['list']],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],
});

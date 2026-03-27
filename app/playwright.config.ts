import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1, // Electron tests must run serially
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});

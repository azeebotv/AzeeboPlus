import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testIgnore: ['**/node_modules/**'],
  fullyParallel: true,
  retries: 0,
  workers: 2,
  timeout: 30_000,
  use: {
    baseURL: process.env.ADMIN_URL || 'http://localhost:4100',
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

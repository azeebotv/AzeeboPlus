import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testIgnore: ['**/node_modules/**'],
  fullyParallel: true,
  retries: 0,
  workers: 4,
  timeout: 30_000,
  use: {
    baseURL: process.env.GATEWAY_URL || 'http://localhost:3013',
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

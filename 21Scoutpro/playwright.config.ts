import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: path.join(rootDir, '.env.e2e') });

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});

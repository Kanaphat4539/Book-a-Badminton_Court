import { defineConfig, devices } from '@playwright/test';

// System + Acceptance tests: drive the real Next.js UI in a real browser while a
// real NestJS backend runs against an in-memory SQLite DB (seeded admin/user +
// 4 courts on boot). Playwright starts both servers automatically.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start',
      cwd: '../backend',
      port: 4001,
      env: { PORT: '4001', DB_TYPE: 'better-sqlite3', DB_NAME: ':memory:' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});

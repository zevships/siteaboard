import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  outputDir: '.local/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4310/siteaboard/',
    trace: 'retain-on-failure',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    env: { SITEABOARD_BASE_PATH: '/siteaboard/' },
    url: 'http://127.0.0.1:4310/siteaboard/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

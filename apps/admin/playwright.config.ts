import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  // Use list + html reporter so CI can collect an HTML report artifact
  reporter: [ ['list'], ['html', { outputFolder: 'playwright-report' }] ],
  // Retries: 2 on CI, 0 locally
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Capture trace on first retry to help debugging flaky tests
    trace: 'on-first-retry',
    // Keep screenshots & video for failures
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Where artifacts will be stored (playwright's default test-results still used)
    // outputDir: 'test-results',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
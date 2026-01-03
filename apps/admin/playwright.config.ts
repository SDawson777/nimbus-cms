import { defineConfig, devices } from '@playwright/test';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // Increase timeouts to tolerate slower CI or local environments where
  // building/hydration/networking can be slower. Tests may perform full
  // SPA navigation and network requests before UI is ready.
  timeout: isCI ? 180_000 : 120_000,
  expect: { timeout: isCI ? 15_000 : 10_000 },
  fullyParallel: true,
  // Use list + html reporter so CI can collect an HTML report artifact.
  // Ensure the reporter never starts a local server (runner scripts should exit).
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
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
import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Force evidence capture for buyer proof - always record
const isCI = process.env.CI === 'true' && process.env.FORCE_EVIDENCE !== 'true';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create timestamped artifacts folder for this test run
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
const artifactsDir = path.resolve(__dirname, `demo-artifacts/${timestamp}`);

// Ensure the artifacts directory exists
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Store artifacts dir in env for test access
process.env.E2E_ARTIFACTS_DIR = artifactsDir;

export default defineConfig({
  testDir: './tests',
  // Increase timeouts to tolerate slower CI or local environments where
  // building/hydration/networking can be slower. Tests may perform full
  // SPA navigation and network requests before UI is ready.
  timeout: isCI ? 180_000 : 120_000,
  expect: { timeout: isCI ? 15_000 : 10_000 },
  fullyParallel: true,
  // Use sequential execution (1 worker) for production-grade stability.
  // Parallel execution can overwhelm dev servers and cause flaky failures.
  // In CI, use 1 worker to ensure consistent, reliable test runs.
  workers: 1,
  // Use list + html reporter so CI can collect an HTML report artifact.
  // Ensure the reporter never starts a local server (runner scripts should exit).
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: `${artifactsDir}/test-results.json` }],
  ],
  // Retries: 2 on CI, 0 locally
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5174',
    headless: process.env.E2E_HEADED !== 'true',
    viewport: { width: 1280, height: 800 },
    // BUYER PROOF: Record ALL evidence for marketing/demo package
    // Always capture screenshots, videos, and traces for production verification
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    // Store artifacts in test-results folder (standard location)
    outputDir: 'test-results',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
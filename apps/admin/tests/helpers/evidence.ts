import type { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Evidence capture utility for comprehensive test artifacts
 */
export class EvidenceCollector {
  private testName: string;
  private artifactsDir: string;
  private logsDir: string;
  private consoleMessages: string[] = [];
  private networkErrors: string[] = [];
  private pageErrors: string[] = [];

  constructor(testInfo: TestInfo) {
    // Clean test name for folder structure
    this.testName = testInfo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Get base artifacts dir from env (set in playwright.config.ts)
    const baseDir = process.env.E2E_ARTIFACTS_DIR || path.resolve(__dirname, '../../demo-artifacts/default');
    this.artifactsDir = path.join(baseDir, this.testName);
    this.logsDir = path.join(this.artifactsDir, 'logs');

    // Ensure directories exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Attach event listeners to capture console, network, and page errors
   */
  attachToPage(page: Page): void {
    // Capture console messages
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString();
      this.consoleMessages.push(`[${timestamp}] [${type.toUpperCase()}] ${text}`);
    });

    // Capture network request failures
    page.on('requestfailed', (request) => {
      const timestamp = new Date().toISOString();
      const failure = request.failure();
      this.networkErrors.push(
        `[${timestamp}] ${request.method()} ${request.url()} - ${failure?.errorText || 'unknown error'}`
      );
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const timestamp = new Date().toISOString();
      this.pageErrors.push(`[${timestamp}] ${error.message}\n${error.stack || ''}`);
    });
  }

  /**
   * Write all captured logs to disk
   */
  async writeLogs(): Promise<void> {
    // Console logs
    if (this.consoleMessages.length > 0) {
      const consolePath = path.join(this.logsDir, 'console.log');
      fs.writeFileSync(consolePath, this.consoleMessages.join('\n'));
    }

    // Network errors
    if (this.networkErrors.length > 0) {
      const networkPath = path.join(this.logsDir, 'network-errors.log');
      fs.writeFileSync(networkPath, this.networkErrors.join('\n'));
    }

    // Page errors
    if (this.pageErrors.length > 0) {
      const errorsPath = path.join(this.logsDir, 'page-errors.log');
      fs.writeFileSync(errorsPath, this.pageErrors.join('\n'));
    }

    // Summary
    const summaryPath = path.join(this.logsDir, 'summary.log');
    const summary = [
      `Test: ${this.testName}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Console Messages: ${this.consoleMessages.length}`,
      `Network Errors: ${this.networkErrors.length}`,
      `Page Errors: ${this.pageErrors.length}`,
      '',
      'Artifacts Location:',
      `  Logs: ${this.logsDir}`,
      `  Video: ${this.artifactsDir}`,
      `  Screenshots: ${this.artifactsDir}`,
      `  Trace: ${this.artifactsDir}`,
    ].join('\n');
    fs.writeFileSync(summaryPath, summary);
  }

  /**
   * Get the artifacts directory path
   */
  getArtifactsDir(): string {
    return this.artifactsDir;
  }

  /**
   * Get stats for reporting
   */
  getStats(): { console: number; network: number; errors: number } {
    return {
      console: this.consoleMessages.length,
      network: this.networkErrors.length,
      errors: this.pageErrors.length,
    };
  }
}

/**
 * Helper to capture a screenshot with a specific name
 */
export async function captureScreenshot(
  page: Page,
  name: string,
  testInfo: TestInfo
): Promise<void> {
  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body: screenshot, contentType: 'image/png' });
}

/**
 * Helper to wait for network idle (no requests for N ms)
 */
export async function waitForNetworkIdle(page: Page, timeout = 2000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

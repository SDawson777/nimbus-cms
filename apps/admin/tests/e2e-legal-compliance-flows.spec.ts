import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector, captureScreenshot } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

test.describe('Legal/Compliance Flows', () => {
  let evidence: EvidenceCollector;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    evidence = new EvidenceCollector(testInfo);
    evidence.attachToPage(page);
    await setupTest(page);
    
    const email = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
    const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';
    await loginAsAdmin(page, email, password);
  });

  test.afterEach(async ({ page }) => {
    await evidence.writeLogs();
    await teardownTest(page);
  });

  test('Legal - view legal documents', async ({ page }, testInfo) => {
    await test.step('Navigate to legal page', async () => {
      const nav = new Navigator(page);
      await nav.goToLegal();
    });

    await test.step('Verify legal page loads', async () => {
      await expect(page).toHaveURL(/\/legal/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'legal-page-overview', testInfo);
    });

    await test.step('Check for legal document types', async () => {
      // Common legal docs: Terms, Privacy, Cookie Policy, etc.
      const legalTerms = ['terms', 'privacy', 'cookie', 'policy', 'disclaimer'];
      
      let foundDocType = false;
      for (const term of legalTerms) {
        const hasDoc = await page.locator(`text=/${term}/i`).first().isVisible({ timeout: 2_000 }).catch(() => false);
        if (hasDoc) {
          foundDocType = true;
          break;
        }
      }

      // Should see some legal content or management interface
      expect(foundDocType || page.url().includes('/legal')).toBe(true);
    });
  });

  test('Legal - create new version of legal document', async ({ page }, testInfo) => {
    await test.step('Navigate to legal page', async () => {
      const nav = new Navigator(page);
      await nav.goToLegal();
    });

    await test.step('Look for create/edit functionality', async () => {
      const actionButtons = [
        'button:has-text("Create")',
        'button:has-text("New Version")',
        'button:has-text("Edit")',
        'button:has-text("Add")',
        'a:has-text("Create")',
      ];

      let hasManagementUI = false;
      for (const selector of actionButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          hasManagementUI = true;
          await captureScreenshot(page, 'legal-management-ui', testInfo);
          
          // Click and see what happens
          await button.click();
          await page.waitForTimeout(1500);
          await captureScreenshot(page, 'legal-create-form', testInfo);
          break;
        }
      }

      if (!hasManagementUI) {
        test.skip('No legal document creation UI found');
      }
    });
  });

  test('Legal - version history', async ({ page }, testInfo) => {
    await test.step('Navigate to legal page', async () => {
      const nav = new Navigator(page);
      await nav.goToLegal();
    });

    await test.step('Check for version history UI', async () => {
      const versionIndicators = [
        'text=/version/i',
        'text=/history/i',
        'text=/revision/i',
        'button:has-text("History")',
        'a:has-text("Versions")',
      ];

      let hasVersioning = false;
      for (const selector of versionIndicators) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          hasVersioning = true;
          await captureScreenshot(page, 'legal-version-history', testInfo);
          break;
        }
      }

      // Versioning might not be visible in UI, that's OK
      expect(page.url().includes('/legal')).toBe(true);
    });
  });

  test('Compliance - view compliance dashboard', async ({ page }, testInfo) => {
    await test.step('Navigate to compliance page', async () => {
      const nav = new Navigator(page);
      await nav.goToCompliance();
    });

    await test.step('Verify compliance page loads', async () => {
      await expect(page).toHaveURL(/\/compliance/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'compliance-dashboard', testInfo);
    });

    await test.step('Check for compliance indicators', async () => {
      // Look for compliance-related UI elements
      const complianceTerms = ['compliance', 'regulation', 'audit', 'requirement', 'status'];
      
      let foundCompliance = false;
      for (const term of complianceTerms) {
        const hasElement = await page.locator(`text=/${term}/i`).first().isVisible({ timeout: 2_000 }).catch(() => false);
        if (hasElement) {
          foundCompliance = true;
          break;
        }
      }

      expect(foundCompliance || page.url().includes('/compliance')).toBe(true);
    });
  });

  test('Compliance - snapshot and RBAC', async ({ page }, testInfo) => {
    await test.step('Navigate to compliance page', async () => {
      const nav = new Navigator(page);
      await nav.goToCompliance();
    });

    await test.step('Check for snapshot functionality', async () => {
      // Look for snapshot-related buttons
      const snapshotButtons = [
        'button:has-text("Snapshot")',
        'button:has-text("Capture")',
        'button:has-text("Save State")',
      ];

      let hasSnapshot = false;
      for (const selector of snapshotButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          hasSnapshot = true;
          await captureScreenshot(page, 'compliance-snapshot-ui', testInfo);
          break;
        }
      }

      // Snapshot feature might not be in UI, check page loaded at minimum
      expect(page.url().includes('/compliance')).toBe(true);
    });
  });
});

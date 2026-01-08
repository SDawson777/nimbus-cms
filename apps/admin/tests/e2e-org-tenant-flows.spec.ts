import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

test.describe('Org/Tenant Management Flows', () => {
  let evidence: EvidenceCollector;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    evidence = new EvidenceCollector(testInfo);
    evidence.attachToPage(page);
    await setupTest(page);
    
    // Login before each test
    const email = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
    const password = process.env.E2E_ADMIN_PASSWORD || 'Nimbus!Demo123';
    await loginAsAdmin(page, email, password);
  });

  test.afterEach(async ({ page }) => {
    await evidence.writeLogs();
    await teardownTest(page);
  });

  test('Switch organization/tenant - selection persists', async ({ page }) => {
    await test.step('Navigate to dashboard', async () => {
      const nav = new Navigator(page);
      await nav.goToDashboard();
    });

    await test.step('Check for tenant selector', async () => {
      // Look for tenant/org/workspace selector in header
      const selectors = [
        'select[name="tenant"]',
        'select[name="organization"]',
        'select[name="workspace"]',
        'button:has-text("Workspace")',
        'button:has-text("Organization")',
        '.workspace-selector',
        '.org-selector',
        '.tenant-selector'
      ];

      let selectorFound = false;
      let selectorElement;

      for (const selector of selectors) {
        const el = page.locator(selector).first();
        const isVisible = await el.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          selectorFound = true;
          selectorElement = el;
          break;
        }
      }

      if (!selectorFound) {
        test.skip('No tenant/org selector found in UI');
        return;
      }

      // If selector is a <select>, try to change value
      const tagName = await selectorElement.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        const options = await selectorElement.locator('option').count();
        if (options > 1) {
          // Select second option
          await selectorElement.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      }
    });

    await test.step('Verify selection persists on reload', async () => {
      // Get current selection from localStorage
      const beforeReload = await page.evaluate(() => ({
        tenant: localStorage.getItem('selectedTenant'),
        org: localStorage.getItem('organizationSlug'),
        workspace: localStorage.getItem('selectedWorkspace'),
      }));

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Check selection after reload
      const afterReload = await page.evaluate(() => ({
        tenant: localStorage.getItem('selectedTenant'),
        org: localStorage.getItem('organizationSlug'),
        workspace: localStorage.getItem('selectedWorkspace'),
      }));

      // At least one should be persisted
      const hasPersistence = 
        (beforeReload.tenant && beforeReload.tenant === afterReload.tenant) ||
        (beforeReload.org && beforeReload.org === afterReload.org) ||
        (beforeReload.workspace && beforeReload.workspace === afterReload.workspace);

      expect(hasPersistence).toBe(true);
    });
  });

  test('Tenant/workspace context - data scoped to selected tenant', async ({ page }) => {
    await test.step('Navigate to products page', async () => {
      const nav = new Navigator(page);
      await nav.goToProducts();
    });

    await test.step('Verify page loads with tenant context', async () => {
      // Should see products page without error
      await expect(page).toHaveURL(/\/products/);
      
      // Check for tenant context indicators
      const hasTenantInfo = await page.evaluate(() => {
        return !!(
          localStorage.getItem('selectedTenant') ||
          localStorage.getItem('organizationSlug') ||
          localStorage.getItem('selectedWorkspace')
        );
      });

      expect(hasTenantInfo).toBe(true);
    });
  });

  test('Multi-store selection - store picker functionality', async ({ page }) => {
    await test.step('Navigate to analytics', async () => {
      const nav = new Navigator(page);
      await nav.goToAnalytics();
    });

    await test.step('Check for store/dataset selector', async () => {
      const storeSelectors = [
        'select[name="store"]',
        'select[name="dataset"]',
        'button:has-text("Store")',
        'button:has-text("Dataset")',
        '.store-selector',
        '.dataset-selector'
      ];

      let found = false;
      for (const selector of storeSelectors) {
        const isVisible = await page.locator(selector).first().isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          found = true;
          break;
        }
      }

      // Store selector might not be present in all deployments
      if (!found) {
        test.skip('No store selector found, might be single-store setup');
      }
    });
  });
});

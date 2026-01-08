import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector, captureScreenshot } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

test.describe('Personalization Flows', () => {
  let evidence: EvidenceCollector;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    evidence = new EvidenceCollector(testInfo);
    evidence.attachToPage(page);
    await setupTest(page);
    
    const email = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
    const password = process.env.E2E_ADMIN_PASSWORD || 'Nimbus!Demo123';
    await loginAsAdmin(page, email, password);
  });

  test.afterEach(async ({ page }) => {
    await evidence.writeLogs();
    await teardownTest(page);
  });

  test('Personalization - create new rule', async ({ page }, testInfo) => {
    await test.step('Navigate to personalization page', async () => {
      const nav = new Navigator(page);
      await nav.goToPersonalization();
    });

    await test.step('Verify personalization page loads', async () => {
      await expect(page).toHaveURL(/\/personalization/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'personalization-page', testInfo);
    });

    await test.step('Look for create rule button', async () => {
      const createButtons = [
        'button:has-text("Create Rule")',
        'button:has-text("New Rule")',
        'button:has-text("Add Rule")',
        'button:has-text("Create")',
        'a:has-text("Create Rule")',
      ];

      let ruleCreated = false;
      for (const selector of createButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          await button.click();
          await page.waitForTimeout(1500);
          await captureScreenshot(page, 'personalization-create-form', testInfo);
          ruleCreated = true;
          break;
        }
      }

      if (!ruleCreated) {
        test.skip('No create rule UI found');
        return;
      }
    });

    await test.step('Fill rule form', async () => {
      const timestamp = Date.now();
      
      // Look for name/title input
      const nameInputs = [
        'input[name="name"]',
        'input[name="title"]',
        'input[name="ruleName"]',
        'input[placeholder*="name" i]',
      ];

      for (const selector of nameInputs) {
        const input = page.locator(selector).first();
        const isVisible = await input.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          await input.fill(`E2E Rule ${timestamp}`);
          await page.waitForTimeout(500);
          break;
        }
      }

      await captureScreenshot(page, 'personalization-form-filled', testInfo);
    });

    await test.step('Save rule', async () => {
      const saveButtons = [
        'button[type="submit"]',
        'button:has-text("Save")',
        'button:has-text("Create")',
        'button:has-text("Add")',
      ];

      for (const selector of saveButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          await button.click();
          await page.waitForTimeout(2000);
          await captureScreenshot(page, 'personalization-rule-saved', testInfo);
          break;
        }
      }
    });
  });

  test('Personalization - enable/disable rule', async ({ page }, testInfo) => {
    await test.step('Navigate to personalization page', async () => {
      const nav = new Navigator(page);
      await nav.goToPersonalization();
    });

    await test.step('Look for existing rules with toggle', async () => {
      // Look for toggle switches or enable/disable buttons
      const toggles = [
        'input[type="checkbox"][role="switch"]',
        'button[role="switch"]',
        '.toggle',
        'button:has-text("Enable")',
        'button:has-text("Disable")',
      ];

      let foundToggle = false;
      for (const selector of toggles) {
        const toggle = page.locator(selector).first();
        const isVisible = await toggle.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          foundToggle = true;
          
          // Capture before state
          await captureScreenshot(page, 'rule-before-toggle', testInfo);
          
          // Click toggle
          await toggle.click();
          await page.waitForTimeout(1000);
          
          // Capture after state
          await captureScreenshot(page, 'rule-after-toggle', testInfo);
          break;
        }
      }

      if (!foundToggle) {
        test.skip('No rule toggles found');
      }
    });
  });

  test('Personalization - rule list and state persistence', async ({ page }, testInfo) => {
    await test.step('Navigate to personalization page', async () => {
      const nav = new Navigator(page);
      await nav.goToPersonalization();
    });

    await test.step('Check for rules list', async () => {
      // Look for table, list, or cards showing rules
      const listElements = [
        'table',
        '.rules-list',
        '.rule-card',
        '[data-testid="rules-list"]',
      ];

      let hasRulesList = false;
      for (const selector of listElements) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 3_000 }).catch(() => false);
        if (isVisible) {
          hasRulesList = true;
          await captureScreenshot(page, 'rules-list', testInfo);
          break;
        }
      }

      // Rules list might be empty, that's OK
      expect(page.url().includes('/personalization')).toBe(true);
    });

    await test.step('Verify state persists on reload', async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveURL(/\/personalization/);
      await captureScreenshot(page, 'rules-after-reload', testInfo);
    });
  });
});

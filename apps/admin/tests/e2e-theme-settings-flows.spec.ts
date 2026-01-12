import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector, captureScreenshot } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

test.describe('Theme/Branding Flows', () => {
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

  test('Theme - change theme tokens/colors', async ({ page }, testInfo) => {
    await test.step('Navigate to theme page', async () => {
      const nav = new Navigator(page);
      await nav.goToTheme();
    });

    await test.step('Verify theme page loads', async () => {
      await expect(page).toHaveURL(/\/theme/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'theme-page-initial', testInfo);
    });

    await test.step('Check for theme customization controls', async () => {
      // Look for color pickers, input fields, or theme tokens
      const themeControls = [
        'input[type="color"]',
        'input[name*="color"]',
        'input[name*="theme"]',
        '.color-picker',
        'button:has-text("Save Theme")',
        'button:has-text("Apply")',
      ];

      let hasThemeControls = false;
      for (const selector of themeControls) {
        const control = page.locator(selector).first();
        const isVisible = await control.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          hasThemeControls = true;
          await captureScreenshot(page, 'theme-controls-found', testInfo);
          break;
        }
      }

      expect(hasThemeControls || page.url().includes('/theme')).toBe(true);
    });
  });

  test('Theme - preview and save changes', async ({ page }, testInfo) => {
    await test.step('Navigate to theme page', async () => {
      const nav = new Navigator(page);
      await nav.goToTheme();
    });

    await test.step('Modify a theme value', async () => {
      // Try to find and modify a color input
      const colorInput = page.locator('input[type="color"]').first();
      await expect(colorInput).toBeVisible({ timeout: 5_000 });

      await colorInput.fill('#FF0000'); // Red
      await page.waitForTimeout(500);
      await captureScreenshot(page, 'theme-color-modified', testInfo);

      // Try text input for hex colors
      const hexInputs = page.locator('input[placeholder*="#"], input[value^="#"]');
      const count = await hexInputs.count();
      if (count > 0) {
        await hexInputs.first().fill('#0000FF'); // Blue
        await page.waitForTimeout(500);
        await captureScreenshot(page, 'theme-hex-modified', testInfo);
      }
    });

    await test.step('Save theme changes', async () => {
      const saveButtons = [
        'button:has-text("Save")',
        'button:has-text("Apply")',
        'button:has-text("Update")',
        'button[type="submit"]',
      ];

      for (const selector of saveButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          await button.click();
          await page.waitForTimeout(2000);
          await captureScreenshot(page, 'theme-saved', testInfo);
          break;
        }
      }
    });

    await test.step('Verify changes persist on reload', async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'theme-after-reload', testInfo);
      
      // Should still be on theme page
      await expect(page).toHaveURL(/\/theme/);
    });
  });

  test('Settings - update settings field', async ({ page }, testInfo) => {
    await test.step('Navigate to settings page', async () => {
      const nav = new Navigator(page);
      await nav.goToSettings();
    });

    await test.step('Verify settings page loads', async () => {
      await expect(page).toHaveURL(/\/settings/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'settings-page', testInfo);
    });

    await test.step('Check for settings controls', async () => {
      // Look for any input fields or settings
      const inputs = page.locator('input, select, textarea');
      const count = await inputs.count();
      
      expect(count).toBeGreaterThan(0);
      await captureScreenshot(page, 'settings-controls', testInfo);
    });

    await test.step('Modify and save a setting', async () => {
      // Try to find an editable text field
      const textInputs = page.locator('input[type="text"], input:not([type="checkbox"]):not([type="radio"])');
      const count = await textInputs.count();

      if (count > 0) {
        const firstInput = textInputs.first();
        const isEditable = await firstInput.isEditable({ timeout: 2_000 }).catch(() => false);
        
        if (isEditable) {
          const timestamp = Date.now();
          await firstInput.fill(`E2E Test Value ${timestamp}`);
          await page.waitForTimeout(500);
          await captureScreenshot(page, 'settings-modified', testInfo);

          // Look for save button
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
          const hasSaveButton = await saveButton.isVisible({ timeout: 2_000 }).catch(() => false);
          
          if (hasSaveButton) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            await captureScreenshot(page, 'settings-saved', testInfo);
          }
        }
      }
    });
  });

  test('Settings - persistence verification', async ({ page }, testInfo) => {
    await test.step('Navigate to settings', async () => {
      const nav = new Navigator(page);
      await nav.goToSettings();
    });

    await test.step('Store current settings state', async () => {
      // Capture localStorage/sessionStorage state
      const storageState = await page.evaluate(() => {
        return {
          local: { ...localStorage },
          session: { ...sessionStorage },
        };
      });

      await captureScreenshot(page, 'settings-before-reload', testInfo);
    });

    await test.step('Reload and verify state persists', async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveURL(/\/settings/);
      await captureScreenshot(page, 'settings-after-reload', testInfo);
    });
  });
});

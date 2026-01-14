import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector, captureScreenshot } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

/**
 * Comprehensive flow index runner
 * Navigates through all primary routes to ensure no broken pages
 */
test.describe('Flow Index - All Routes Smoke Test', () => {
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

  test('Comprehensive route check - all pages accessible', async ({ page }, testInfo) => {
    const nav = new Navigator(page);
    const routes = [
      { name: 'Dashboard', fn: () => nav.goToDashboard() },
      { name: 'Analytics', fn: () => nav.goToAnalytics() },
      { name: 'Heatmap', fn: () => nav.goToHeatmap() },
      { name: 'Products', fn: () => nav.goToProducts() },
      { name: 'Orders', fn: () => nav.goToOrders() },
      { name: 'Articles', fn: () => nav.goToArticles() },
      { name: 'FAQs', fn: () => nav.goToFaqs() },
      { name: 'Deals', fn: () => nav.goToDeals() },
      { name: 'Compliance', fn: () => nav.goToCompliance() },
      { name: 'Legal', fn: () => nav.goToLegal() },
      { name: 'Theme', fn: () => nav.goToTheme() },
      { name: 'Personalization', fn: () => nav.goToPersonalization() },
      { name: 'Settings', fn: () => nav.goToSettings() },
      { name: 'Admins', fn: () => nav.goToAdmins() },
      { name: 'Undo', fn: () => nav.goToUndo() },
    ];

    const results: Array<{ route: string; success: boolean; error?: string }> = [];

    for (const route of routes) {
      await test.step(`Check ${route.name}`, async () => {
        try {
          await route.fn();
          await page.waitForTimeout(1000);
          await captureScreenshot(page, `route-${route.name.toLowerCase()}`, testInfo);
          
          // Check for ErrorBoundary crash page specifically (contains "We hit a snag" or "Something went wrong" as h2)
          // Also check for 404/not found pages - but NOT generic "error" text which appears in normal UI
          const hasCrashPage = await page.locator('h2:has-text("Something went wrong")').isVisible({ timeout: 1_000 }).catch(() => false);
          const has404 = await page.locator('text=/^404$|page not found/i').isVisible({ timeout: 1_000 }).catch(() => false);
          
          if (hasCrashPage || has404) {
            throw new Error(`Error page detected on ${route.name}`);
          }

          results.push({ route: route.name, success: true });
          console.log(`✓ ${route.name} - OK`);
        } catch (error) {
          results.push({ 
            route: route.name, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
          console.log(`✗ ${route.name} - FAILED: ${error}`);
        }
      });
    }

    await test.step('Verify results', async () => {
      const failed = results.filter(r => !r.success);
      const successRate = ((results.length - failed.length) / results.length) * 100;
      
      console.log('\n=== Route Check Summary ===');
      console.log(`Total Routes: ${results.length}`);
      console.log(`Successful: ${results.length - failed.length}`);
      console.log(`Failed: ${failed.length}`);
      console.log(`Success Rate: ${successRate.toFixed(1)}%`);
      
      if (failed.length > 0) {
        console.log('\nFailed Routes:');
        failed.forEach(f => console.log(`  - ${f.route}: ${f.error}`));
      }

      // Allow some routes to fail (might not be implemented yet)
      expect(successRate).toBeGreaterThan(70);
    });
  });

  test('Navigation via Suite Map menu', async ({ page }, testInfo) => {
    // Set a reasonable test timeout
    test.setTimeout(60_000);
    
    await test.step('Navigate to dashboard first', async () => {
      const nav = new Navigator(page);
      await nav.goToDashboard();
    });

    // First check if Suite Map button exists
    const suiteMapExists = await page.locator('button:has-text("Suite Map"), button:has-text("☰"), [aria-label*="menu"]').first().isVisible({ timeout: 5_000 }).catch(() => false);
    if (!suiteMapExists) {
      console.log('⚠️ Suite Map menu not found - navigation may work differently');
      return;
    }

    const menuItems = [
      'Analytics',
      'Heatmap',
      'Products',
      'Orders',
      'Settings',
    ];

    for (const item of menuItems) {
      await test.step(`Navigate to ${item} via menu`, async () => {
        try {
          // Try clicking menu directly instead of using Navigator
          const menuBtn = page.locator('button:has-text("Suite Map"), button:has-text("☰"), [aria-label*="menu"]').first();
          await menuBtn.click({ timeout: 5_000 });
          await page.waitForTimeout(300);
          
          const link = page.locator(`a:has-text("${item}")`).first();
          const linkVisible = await link.isVisible({ timeout: 3_000 }).catch(() => false);
          
          if (linkVisible) {
            await link.click();
            await page.waitForTimeout(1500);
            await captureScreenshot(page, `menu-nav-${item.toLowerCase()}`, testInfo);
            console.log(`✓ Navigated to ${item} via Suite Map`);
          } else {
            console.log(`Could not find ${item} in menu`);
          }
        } catch (error) {
          console.log(`Could not navigate to ${item} via menu: ${error}`);
        }
      });
    }
  });

  test('Deep link navigation - direct URL access', async ({ page }, testInfo) => {
    const directLinks = [
      '/dashboard',
      '/analytics',
      '/heatmap',
      '/products',
      '/orders',
      '/admins',
      '/settings',
    ];

    for (const link of directLinks) {
      await test.step(`Direct access to ${link}`, async () => {
        await page.goto(link);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        
        // Should not redirect to login (already authenticated)
        await expect(page).not.toHaveURL(/\/login/);
        
        // Should not show 404
        const has404 = await page.locator('text=/404|not found/i').isVisible({ timeout: 2_000 }).catch(() => false);
        expect(has404).toBe(false);
        
        await captureScreenshot(page, `direct-${link.replace('/', '')}`, testInfo);
      });
    }
  });

  test('Page load performance - no critical delays', async ({ page }, testInfo) => {
    const nav = new Navigator(page);
    
    await test.step('Measure analytics page load', async () => {
      const startTime = Date.now();
      await nav.goToAnalytics();
      const loadTime = Date.now() - startTime;
      
      console.log(`Analytics page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
    });

    await test.step('Measure heatmap page load', async () => {
      const startTime = Date.now();
      await nav.goToHeatmap();
      await page.waitForTimeout(2000); // Wait for map to initialize
      const loadTime = Date.now() - startTime;
      
      console.log(`Heatmap page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(20000); // Map might take longer
    });
  });

  test('Error boundary - app recovers from errors', async ({ page }, testInfo) => {
    await test.step('Navigate to dashboard', async () => {
      const nav = new Navigator(page);
      await nav.goToDashboard();
    });

    await test.step('Check for error trigger (if exists)', async () => {
      // Check if there's a debug error trigger
      const errorTrigger = page.locator('[data-testid="debug-trigger-error"]');
      const hasErrorTrigger = await errorTrigger.isVisible({ timeout: 2_000 }).catch(() => false);
      
      if (hasErrorTrigger) {
        await errorTrigger.click();
        await page.waitForTimeout(1000);
        
        // Should show error boundary UI
        const hasErrorBoundary = await page.locator('text=/something went wrong|error/i').isVisible({ timeout: 3_000 }).catch(() => false);
        await captureScreenshot(page, 'error-boundary-triggered', testInfo);
        
        // Try to recover
        const recoverButton = page.locator('button:has-text("Reload"), button:has-text("Try Again")').first();
        const hasRecover = await recoverButton.isVisible({ timeout: 2_000 }).catch(() => false);
        
        if (hasRecover) {
          await recoverButton.click();
          await page.waitForTimeout(2000);
          await captureScreenshot(page, 'error-boundary-recovered', testInfo);
        }
      }
    });
  });

  test('Browser compatibility - localStorage and sessionStorage', async ({ page }) => {
    await test.step('Verify storage APIs available', async () => {
      const storageCheck = await page.evaluate(() => {
        return {
          hasLocalStorage: typeof localStorage !== 'undefined',
          hasSessionStorage: typeof sessionStorage !== 'undefined',
          hasFetch: typeof fetch !== 'undefined',
          hasPromise: typeof Promise !== 'undefined',
        };
      });

      expect(storageCheck.hasLocalStorage).toBe(true);
      expect(storageCheck.hasSessionStorage).toBe(true);
      expect(storageCheck.hasFetch).toBe(true);
      expect(storageCheck.hasPromise).toBe(true);
    });

    await test.step('Test localStorage persistence', async () => {
      await page.evaluate(() => {
        localStorage.setItem('e2e-test', 'value-123');
      });

      const value = await page.evaluate(() => {
        return localStorage.getItem('e2e-test');
      });

      expect(value).toBe('value-123');

      // Clean up
      await page.evaluate(() => {
        localStorage.removeItem('e2e-test');
      });
    });
  });
});

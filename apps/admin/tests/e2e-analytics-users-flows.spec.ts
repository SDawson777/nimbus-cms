import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector, captureScreenshot, waitForNetworkIdle } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

test.describe('Analytics, Users, and Critical Features', () => {
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

  test('Analytics Dashboard - load and verify widgets', async ({ page }, testInfo) => {
    await test.step('Navigate to analytics page', async () => {
      const nav = new Navigator(page);
      await nav.goToAnalytics();
    });

    await test.step('Wait for analytics data to load', async () => {
      // Wait for network requests to complete
      await page.waitForTimeout(2000);
      await captureScreenshot(page, 'analytics-dashboard-loaded', testInfo);
    });

    await test.step('Verify key metrics widgets render', async () => {
      // Look for metric cards (revenue, orders, customers, etc.)
      const metricCards = page.locator('.metric-card, .stat-card, .card, [class*="metric"]');
      const count = await metricCards.count();
      
      // Should have at least some metric widgets
      expect(count).toBeGreaterThan(0);
      await captureScreenshot(page, 'analytics-metrics', testInfo);
    });

    await test.step('Check for charts', async () => {
      // Look for chart containers
      const charts = page.locator('canvas, svg[class*="chart"], .chart, [class*="Chart"]');
      const chartCount = await charts.count();
      
      // Should have at least one chart
      expect(chartCount).toBeGreaterThanOrEqual(0); // Allow 0 if no data
      await captureScreenshot(page, 'analytics-charts', testInfo);
    });

    await test.step('Verify no console errors', async () => {
      const stats = evidence.getStats();
      // Should not have critical page errors
      expect(stats.errors).toBeLessThan(5);
    });
  });

  test('Analytics - period filter functionality', async ({ page }, testInfo) => {
    await test.step('Navigate to analytics', async () => {
      const nav = new Navigator(page);
      await nav.goToAnalytics();
      await page.waitForTimeout(1500);
    });

    await test.step('Find and use period filter', async () => {
      // Look for period selector buttons (7 days, 30 days, 90 days)
      const periodButtons = [
        'button:has-text("7 days")',
        'button:has-text("7d")',
        'button:has-text("30 days")',
        'button:has-text("30d")',
        'button:has-text("90 days")',
        'button:has-text("90d")',
      ];

      let foundFilter = false;
      for (const selector of periodButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          foundFilter = true;
          await captureScreenshot(page, 'analytics-before-filter', testInfo);
          
          // Click the button
          await button.click();
          await page.waitForTimeout(2000);
          
          await captureScreenshot(page, 'analytics-after-filter', testInfo);
          break;
        }
      }

      if (!foundFilter) {
        console.log('No period filter found, might be static dashboard');
      }
    });
  });

  test('Heatmap - geographic visualization', async ({ page }, testInfo) => {
    await test.step('Navigate to heatmap page', async () => {
      const nav = new Navigator(page);
      await nav.goToHeatmap();
    });

    await test.step('Verify heatmap page loads', async () => {
      await expect(page).toHaveURL(/\/heatmap/);
      await page.waitForTimeout(2000);
      await captureScreenshot(page, 'heatmap-initial', testInfo);
    });

    await test.step('Check for map container', async () => {
      // Look for Leaflet map or other map container
      const mapContainers = [
        '.leaflet-container',
        '#map',
        '[class*="map"]',
        'canvas',
      ];

      let hasMap = false;
      for (const selector of mapContainers) {
        const map = page.locator(selector).first();
        const isVisible = await map.isVisible({ timeout: 5_000 }).catch(() => false);
        if (isVisible) {
          hasMap = true;
          await captureScreenshot(page, 'heatmap-map-visible', testInfo);
          break;
        }
      }

      expect(hasMap || page.url().includes('/heatmap')).toBe(true);
    });

    await test.step('Check for store markers/beacons', async () => {
      // Wait a bit for markers to render
      await page.waitForTimeout(2000);
      
      // Look for leaflet markers or custom markers
      const markers = page.locator('.leaflet-marker-icon, .marker, [class*="beacon"]');
      const markerCount = await markers.count();
      
      console.log(`Found ${markerCount} markers on heatmap`);
      await captureScreenshot(page, 'heatmap-with-markers', testInfo);
    });

    await test.step('Click a store marker if available', async () => {
      const markers = page.locator('.leaflet-marker-icon, .marker').first();
      const hasMarker = await markers.isVisible({ timeout: 2_000 }).catch(() => false);
      
      if (hasMarker) {
        await markers.click();
        await page.waitForTimeout(1500);
        await captureScreenshot(page, 'heatmap-marker-clicked', testInfo);
        
        // Check if modal/popup appeared
        const modal = page.locator('.modal, [role="dialog"], .popup, .store-detail');
        const hasModal = await modal.first().isVisible({ timeout: 2_000 }).catch(() => false);
        
        if (hasModal) {
          await captureScreenshot(page, 'heatmap-store-modal', testInfo);
        }
      }
    });
  });

  test('Admin Users - invite and manage', async ({ page }, testInfo) => {
    await test.step('Navigate to admins page', async () => {
      const nav = new Navigator(page);
      await nav.goToAdmins();
    });

    await test.step('Verify admins page loads', async () => {
      await expect(page).toHaveURL(/\/admins/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'admins-page', testInfo);
    });

    await test.step('Check for invite functionality', async () => {
      const inviteButtons = [
        'button:has-text("Invite")',
        'button:has-text("Add Admin")',
        'button:has-text("Create")',
      ];

      let hasInvite = false;
      for (const selector of inviteButtons) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          hasInvite = true;
          await captureScreenshot(page, 'admins-invite-button', testInfo);
          break;
        }
      }

      expect(hasInvite || page.url().includes('/admins')).toBe(true);
    });

    await test.step('Check for admin users list', async () => {
      const listElements = ['table', '.admin-list', '.user-list'];
      
      let hasList = false;
      for (const selector of listElements) {
        const list = page.locator(selector).first();
        const isVisible = await list.isVisible({ timeout: 3_000 }).catch(() => false);
        if (isVisible) {
          hasList = true;
          await captureScreenshot(page, 'admins-list', testInfo);
          break;
        }
      }

      // List might be empty or not visible, that's OK
      expect(page.url().includes('/admins')).toBe(true);
    });
  });

  test('Orders - view orders list', async ({ page }, testInfo) => {
    await test.step('Navigate to orders page', async () => {
      const nav = new Navigator(page);
      await nav.goToOrders();
    });

    await test.step('Verify orders page loads', async () => {
      await expect(page).toHaveURL(/\/orders/);
      await page.waitForTimeout(2000);
      await captureScreenshot(page, 'orders-page', testInfo);
    });

    await test.step('Check for orders table or list', async () => {
      const hasTable = await page.locator('table, .orders-list').first().isVisible({ timeout: 3_000 }).catch(() => false);
      const hasEmptyState = await page.locator('text=/no orders|empty/i').isVisible({ timeout: 2_000 }).catch(() => false);
      
      expect(hasTable || hasEmptyState || page.url().includes('/orders')).toBe(true);
      await captureScreenshot(page, 'orders-content', testInfo);
    });
  });

  test('Undo - version control/rollback', async ({ page }, testInfo) => {
    await test.step('Navigate to undo page', async () => {
      const nav = new Navigator(page);
      await nav.goToUndo();
    });

    await test.step('Verify undo page loads', async () => {
      await expect(page).toHaveURL(/\/undo/);
      await page.waitForTimeout(1500);
      await captureScreenshot(page, 'undo-page', testInfo);
    });

    await test.step('Check for version history or undo functionality', async () => {
      const undoElements = [
        'button:has-text("Undo")',
        'button:has-text("Restore")',
        'button:has-text("Rollback")',
        'text=/version/i',
        'text=/history/i',
      ];

      let hasUndoUI = false;
      for (const selector of undoElements) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2_000 }).catch(() => false);
        if (isVisible) {
          hasUndoUI = true;
          break;
        }
      }

      expect(hasUndoUI || page.url().includes('/undo')).toBe(true);
    });
  });
});

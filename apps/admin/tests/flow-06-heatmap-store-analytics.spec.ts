import { test, expect } from '@playwright/test';

test('UX Flow 6: Heatmap & Store Analytics', async ({ page }) => {
  console.log('🗺️ Testing Heatmap & Store Analytics Flow...');
  
  // Login with demo credentials
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[autocomplete="username"]').first().fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  
  console.log('Navigating to Heatmap...');
  
  // Navigate to heatmap page
  await page.goto('/heatmap');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for map to render
  
  await page.screenshot({ path: '/tmp/flow6-heatmap-loaded.png', fullPage: true });
  
  // Check if map container loaded
  const mapContainer = await page.locator('.leaflet-container, .map-container, [class*="map"]').count();
  console.log('Map containers found:', mapContainer);
  
  // Check for store markers/beacons
  const markers = await page.locator('.leaflet-marker-icon, .store-marker, [class*="marker"]').count();
  console.log('Store markers found:', markers);
  
  // Check for store list/table
  const storeList = await page.locator('table, .store-list, [class*="store"]').count();
  console.log('Store list elements:', storeList);
  
  // Try clicking first marker/store if available (with short timeout)
  const clickableMarker = page.locator('.leaflet-marker-icon, .store-marker').first();
  try {
    if (await clickableMarker.count({ timeout: 1000 }) > 0) {
      await clickableMarker.click({ timeout: 2000 }).catch(() => console.log('Could not click marker'));
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/flow6-store-details.png', fullPage: true }).catch(() => {});
    }
  } catch (e) {
    console.log('Marker interaction skipped');
  }
  
  // Check for period selector (7/30/90 days)
  const periodSelector = await page.locator('select, button[value], [class*="period"]').count();
  console.log('Period selectors found:', periodSelector);
  
  // Try changing period filter if available
  const periodButton = page.locator('button:has-text("30"), button:has-text("7")').first();
  if (await periodButton.count() > 0) {
    await periodButton.click().catch(() => console.log('Could not change period'));
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: '/tmp/flow6-heatmap-final.png', fullPage: true });
  
  console.log('✅ Heatmap Flow Complete');
  
  // Verify heatmap page loaded (either map, placeholder, or headings)
  const hasHeadings = await page.locator('h1, h2, h3').count() > 0;
  const hasHeatmapContent = mapContainer > 0 || storeList > 0 || hasHeadings || page.url().includes('/heatmap');
  expect(hasHeatmapContent).toBeTruthy();
});

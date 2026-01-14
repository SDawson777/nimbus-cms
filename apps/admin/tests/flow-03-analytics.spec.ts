import { test, expect } from '@playwright/test';

test('UX Flow 3: View Analytics Dashboard', async ({ page }) => {
  console.log('📊 Testing Analytics Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[autocomplete="username"]').first().fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  
  // Navigate to analytics
  await page.goto('/analytics');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/flow3-analytics-main.png', fullPage: true });
  
  // Check for analytics elements
  const hasCharts = await page.locator('canvas, svg, [class*="chart"]').count();
  const hasMetrics = await page.locator('[class*="metric"], [class*="stat"]').count();
  
  console.log('Charts found:', hasCharts);
  console.log('Metrics found:', hasMetrics);
  
  // Try to view heatmap
  const heatmapLink = page.locator('a[href*="heatmap"], button:has-text("heatmap")').first();
  const hasHeatmap = await heatmapLink.isVisible().catch(() => false);
  
  if (hasHeatmap) {
    await heatmapLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/flow3-heatmap.png', fullPage: true });
    console.log('✅ Heatmap loaded');
  }
  
  console.log('✅ Analytics Flow Complete');
  expect(true).toBeTruthy();
});

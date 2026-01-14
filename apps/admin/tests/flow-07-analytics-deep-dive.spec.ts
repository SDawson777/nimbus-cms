import { test, expect } from '@playwright/test';

test('UX Flow 7: Analytics Dashboard Deep Dive', async ({ page }) => {
  console.log('📊 Testing Analytics Deep Dive Flow...');
  
  // Login
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
  
  console.log('Navigating to Analytics...');
  
  // Go to analytics
  await page.goto('/analytics');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow7-analytics-overview.png', fullPage: true });
  
  // Check for metric cards
  const metricCards = await page.locator('.card, .metric, [class*="stat"]').count();
  console.log('Metric cards found:', metricCards);
  
  // Check for charts
  const charts = await page.locator('canvas, svg, [class*="chart"]').count();
  console.log('Charts found:', charts);
  
  // Check for period selector
  const periodButtons = await page.locator('button:has-text("7"), button:has-text("30"), button:has-text("90")').count();
  console.log('Period buttons found:', periodButtons);
  
  // Try clicking 7-day period
  const sevenDayButton = page.locator('button:has-text("7")').first();
  if (await sevenDayButton.count() > 0) {
    console.log('Switching to 7-day period...');
    await sevenDayButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow7-analytics-7day.png', fullPage: true });
  }
  
  // Try clicking 90-day period
  const ninetyDayButton = page.locator('button:has-text("90")').first();
  if (await ninetyDayButton.count() > 0) {
    console.log('Switching to 90-day period...');
    await ninetyDayButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow7-analytics-90day.png', fullPage: true });
  }
  
  // Check for top products section
  const topProducts = await page.locator('text=/top.*product/i').or(page.locator('[class*="product"]')).count();
  console.log('Top products section:', topProducts);
  
  // Check for trend indicators
  const trends = await page.locator('text=/↑|↓|%/').or(page.locator('[class*="trend"]')).count();
  console.log('Trend indicators:', trends);
  
  await page.screenshot({ path: '/tmp/flow7-analytics-final.png', fullPage: true });
  
  console.log('✅ Analytics Deep Dive Complete');
  
  // Verify analytics loaded
  const hasAnalyticsContent = metricCards > 0 || charts > 0 || 
                              await page.locator('h1:has-text("Analytics"), h2:has-text("Analytics")').count() > 0;
  expect(hasAnalyticsContent).toBeTruthy();
});

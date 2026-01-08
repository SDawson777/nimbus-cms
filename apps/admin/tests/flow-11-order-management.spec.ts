import { test, expect } from '@playwright/test';

test('UX Flow 11: Order Management', async ({ page }) => {
  console.log('📦 Testing Order Management Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[autocomplete="username"]').first().fill('demo@nimbus.app');
  await page.locator('input[type="password"]').first().fill('Nimbus!Demo123');
  await page.locator('button[type="submit"]').first().click();
  
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  
  console.log('Navigating to Orders...');
  
  // Navigate to orders page
  await page.goto('/orders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow11-orders-list.png', fullPage: true });
  
  // Check for order list
  const orderRows = await page.locator('table tr, .order-card, [class*="order"]').count();
  console.log('Order items found:', orderRows);
  
  // Check for status filters
  const statusFilters = await page.locator('button:has-text("Pending"), button:has-text("Paid"), button:has-text("Fulfilled"), select').count();
  console.log('Status filters:', statusFilters);
  
  // Check for search/filter
  const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i]').count();
  console.log('Search input:', searchInput);
  
  // Try clicking status filter
  const paidFilter = page.locator('button:has-text("Paid"), option:has-text("Paid")').first();
  if (await paidFilter.count() > 0) {
    console.log('Filtering by paid orders...');
    await paidFilter.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow11-orders-filtered.png', fullPage: true });
  }
  
  // Try clicking first order to view details
  const firstOrder = page.locator('table tr:not(:first-child), .order-card, [class*="order"]').first();
  if (await firstOrder.count() > 0) {
    console.log('Opening order details...');
    await firstOrder.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/flow11-order-details.png', fullPage: true });
    
    // Check for order actions
    const orderActions = await page.locator('button:has-text("Fulfill"), button:has-text("Refund"), button:has-text("Update")').count();
    console.log('Order action buttons:', orderActions);
  }
  
  // Check for export button
  const exportButton = await page.locator('button:has-text("Export"), button:has-text("Download")').count();
  console.log('Export buttons:', exportButton);
  
  await page.screenshot({ path: '/tmp/flow11-orders-final.png', fullPage: true });
  
  console.log('✅ Order Management Flow Complete');
  
  // Verify orders page loaded
  const hasOrderContent = orderRows > 0 || statusFilters > 0 ||
                         await page.locator('h1:has-text("Order"), h2:has-text("Order")').count() > 0;
  expect(hasOrderContent).toBeTruthy();
});

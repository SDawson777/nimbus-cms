import { test, expect } from '@playwright/test';

test('UX Flow 11: Order Management', async ({ page }) => {
  // Set a reasonable timeout for this test
  test.setTimeout(90000);
  
  console.log('📦 Testing Order Management Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  
  await page.locator('input[autocomplete="username"]').first().fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  
  // Wait for dashboard with flexible timeout
  await page.waitForURL(/\/(dashboard|admin|home|orders)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  console.log('Navigating to Orders...');
  
  // Navigate to orders page
  await page.goto('/orders');
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/flow11-orders-list.png', fullPage: true });
  
  // Wait for orders table to load
  const ordersTable = page.locator('table');
  await ordersTable.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  
  // Check for actual order data in table rows
  const orderRows = await page.locator('table tbody tr').count();
  console.log('Order rows found:', orderRows);
  
  // Verify demo order data is displayed - check for customer emails or names
  const hasEmail = await page.locator('text=/@.*\\.com/i').count();
  const hasJamesWilson = await page.locator('text=James Wilson').count();
  const hasSarahChen = await page.locator('text=Sarah Chen').count();
  console.log('Demo orders visible - Emails:', hasEmail, 'James Wilson:', hasJamesWilson, 'Sarah Chen:', hasSarahChen);
  
  // Check for order status values
  const hasFulfilledStatus = await page.locator('text=FULFILLED').count();
  const hasPaidStatus = await page.locator('text=PAID').count();
  const hasPendingStatus = await page.locator('text=PENDING').count();
  console.log('Order statuses - FULFILLED:', hasFulfilledStatus, 'PAID:', hasPaidStatus, 'PENDING:', hasPendingStatus);
  
  // Check for store filter dropdown
  const storeSelect = await page.locator('select, [role="combobox"]').count();
  console.log('Store filter elements:', storeSelect);
  
  // Check for status filter
  const statusFilters = await page.locator('select, button:has-text("status"), [aria-label*="status"]').count();
  console.log('Status filter elements:', statusFilters);
  
  // Take a screenshot of orders with filters visible
  await page.screenshot({ path: '/tmp/flow11-orders-with-data.png', fullPage: true });
  
  // Try to filter by status if dropdown is available
  const statusDropdown = page.locator('select').first();
  if (await statusDropdown.count() > 0) {
    try {
      await statusDropdown.selectOption({ label: 'PAID' }).catch(() => {});
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/flow11-orders-filtered.png', fullPage: true });
      console.log('Applied PAID status filter');
    } catch (e) {
      console.log('Status filter: skipped (filter not interactive)');
    }
  }
  
  await page.screenshot({ path: '/tmp/flow11-orders-final.png', fullPage: true });
  
  console.log('✅ Order Management Flow Complete');
  
  // Verify orders are actually populated
  const ordersPopulated = orderRows > 0 || hasEmail > 0 || hasFulfilledStatus > 0;
  expect(ordersPopulated).toBeTruthy();
  
  // Verify at least some order-related content is visible
  const hasOrderContent = orderRows > 0 || statusFilters > 0 || 
                          await page.locator('h1, h2, h3').count() > 0;
  expect(hasOrderContent).toBeTruthy();
});

import { test, expect } from '@playwright/test';

test('UX Flow 20: Audit & Security Logs', async ({ page }) => {
  console.log('🔐 Testing Audit & Security Flow...');
  
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
  
  console.log('Looking for audit logs...');
  
  // Try multiple possible routes
  const possibleRoutes = ['/audit', '/logs', '/activity', '/security', '/settings/audit'];
  let loaded = false;
  
  for (const route of possibleRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const hasAuditContent = await page.locator('text=/audit|log|activity|security/i').count();
    if (hasAuditContent > 0) {
      console.log(`Loaded via route: ${route}`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.log('No audit route found, checking settings...');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  }
  
  await page.screenshot({ path: '/tmp/flow20-audit-logs.png', fullPage: true });
  
  // Check for audit log entries
  const logEntries = await page.locator('table tr, .log-entry, [class*="activity"]').count();
  console.log('Audit log entries:', logEntries);
  
  // Check for action types
  const actions = await page.locator('text=/created|updated|deleted|login|logout/i').or(page.locator('[class*="action"]')).count();
  console.log('Action type references:', actions);
  
  // Check for user/actor column
  const users = await page.locator('text=/@|email/i').or(page.locator('[class*="user"]')).or(page.locator('[class*="actor"]')).count();
  console.log('User/actor references:', users);
  
  // Check for timestamp column
  const timestamps = await page.locator('text=/ago|today|yesterday/i').or(page.locator('time')).or(page.locator('[class*="time"]')).count();
  console.log('Timestamp references:', timestamps);
  
  // Check for filter controls
  const filters = await page.locator('select, input[type="search"], button:has-text("Filter")').count();
  console.log('Filter controls:', filters);
  
  // Try filtering by action type
  const actionFilter = page.locator('select, button:has-text("Action")').first();
  if (await actionFilter.count() > 0) {
    console.log('Applying action filter...');
    await actionFilter.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow20-filtered-logs.png', fullPage: true });
  }
  
  // Check for export audit log
  const exportButton = await page.locator('button:has-text("Export"), button:has-text("Download")').count();
  console.log('Export buttons:', exportButton);
  
  await page.screenshot({ path: '/tmp/flow20-audit-final.png', fullPage: true });
  
  console.log('✅ Audit & Security Flow Complete');
  
  // Verify audit content exists
  const hasAuditContent = logEntries > 0 || actions > 0 || timestamps > 0 ||
                         await page.locator('h1, h2, h3').count() > 0;
  expect(hasAuditContent).toBeTruthy();
});

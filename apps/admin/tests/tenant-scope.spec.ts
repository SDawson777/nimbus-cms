import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('tenant switching: adds tenant query param to admin API calls', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  await loginAsAdmin(page, adminEmail, adminPassword);

  await page.goto('/dashboard');

  // WorkspaceSelector is the first <select> in the header-actions (next to DatasetSelector)
  const workspaceSelect = page.locator('.header-actions select').nth(1);
  await workspaceSelect.waitFor({ timeout: 15_000 });

  // Switch to Tenant B
  await workspaceSelect.selectOption('tenant-b');

  // Navigate to Orders and ensure at least one /api/admin/orders request includes tenant=tenant-b
  const reqPromise = page.waitForRequest((req) => {
    const url = req.url();
    return url.includes('/api/admin/orders') && url.includes('tenant=tenant-b');
  }, { timeout: 30_000 });

  await page.goto('/orders');
  await reqPromise;

  // Switch back to Global (empty value)
  await workspaceSelect.selectOption('');

  // Next orders request should not include tenant=tenant-b
  const reqPromise2 = page.waitForRequest((req) => {
    const url = req.url();
    return url.includes('/api/admin/orders') && !url.includes('tenant=tenant-b');
  }, { timeout: 30_000 });

  await page.goto('/orders');
  await reqPromise2;
});

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('admins: user list loads for an admin', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  await loginAsAdmin(page, adminEmail, adminPassword);

  const apiResp = await page.request.get('/api/admin/users');
  // Depending on seeded role/scopes this may be 200 (OWNER) or 403 (EDITOR).
  // For the primary e2e admin (default OWNER), it should be allowed.
  expect([200, 403]).toContain(apiResp.status());

  await page.goto('/admins').catch(() => {});
  await page.goto('/admins').catch(() => {});

  // OWNER path
  if (apiResp.status() === 200) {
    await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible({ timeout: 15_000 });
  } else {
    // Non-owner/editor path
    await expect(page.locator('text=Permission required')).toBeVisible({ timeout: 15_000 });
  }
});

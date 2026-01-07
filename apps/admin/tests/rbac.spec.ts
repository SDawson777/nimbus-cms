import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('RBAC: owner vs editor access', async ({ page }) => {
  const ownerEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const ownerPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  const editorEmail = process.env.E2E_ADMIN_SECONDARY_EMAIL || 'e2e-editor@example.com';
  const editorPassword = process.env.E2E_ADMIN_SECONDARY_PASSWORD || (editorEmail.split('@')[0] + '-pass');

  // Owner login via browser fetch so auth cookies are set.
  await loginAsAdmin(page, ownerEmail, ownerPassword);

  // Owner should be able to list admins via API
  const ownerListResp = await page.request.get('/api/admin/users');
  expect(ownerListResp.status()).toBe(200);

  await page.goto('/admins');
  await page.waitForSelector('h2', { timeout: 10000 });
  await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible({ timeout: 5000 });

  // Logout (server clears cookies)
  await page.evaluate(async () => {
    await fetch(new URL('/admin/logout', window.location.origin).toString(), { method: 'GET' });
  });
  await page.goto('/login');

  // Editor: log in via browser fetch, then attempt /admins
  await loginAsAdmin(page, editorEmail, editorPassword);

  // Editor should be forbidden from listing admins via API
  const editorListResp = await page.request.get('/api/admin/users');
  expect(editorListResp.status()).toBe(403);

  // Visiting /admins as a non-owner may either render a permission UI or redirect
  // back to /login depending on the shell's auth/route-guard behavior.
  await page.goto('/admins').catch(() => {});
  if (/\/login(\?|$)/.test(page.url())) {
    await expect(page.locator('h2', { hasText: 'Admin Login' })).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(page.locator('text=Permission required')).toBeVisible({ timeout: 15_000 });
  }
});

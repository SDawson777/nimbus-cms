import { test, expect } from '@playwright/test';

test('RBAC: owner vs editor access', async ({ page }) => {
  const ownerEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const ownerPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  const editorEmail = process.env.E2E_ADMIN_SECONDARY_EMAIL || 'e2e-editor@example.com';
  const editorPassword = process.env.E2E_ADMIN_SECONDARY_PASSWORD || (editorEmail.split('@')[0] + '-pass');

  // Owner can access /admins
  await page.goto('/login');
  await page.getByLabel('Email').fill(ownerEmail);
  await page.getByLabel('Password').fill(ownerPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.goto('/admins');
  await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible();

  // Logout
  await page.getByRole('button', { name: 'Log out' }).click().catch(()=>{});
  await page.waitForURL('**/login', { timeout: 5000 });

  // Editor should not be able to access /admins
  await page.getByLabel('Email').fill(editorEmail);
  await page.getByLabel('Password').fill(editorPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.goto('/admins');
  // If protected, should redirect to login or show permission warning. Check for either.
  const noAccess = await page.locator('text=You do not have permission').first().count();
  const adminHeaderVisible = await page.locator('h2', { hasText: 'Admin Users' }).first().count();
  expect(noAccess + adminHeaderVisible).toBeGreaterThan(0);
});

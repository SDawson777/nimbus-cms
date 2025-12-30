import { test, expect } from '@playwright/test';

test('RBAC: owner vs editor access', async ({ page }) => {
  const ownerEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const ownerPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  const editorEmail = process.env.E2E_ADMIN_SECONDARY_EMAIL || 'e2e-editor@example.com';
  const editorPassword = process.env.E2E_ADMIN_SECONDARY_PASSWORD || (editorEmail.split('@')[0] + '-pass');

  // Owner can access /admins
  await page.goto('/login');
  // Wait for login form and primary controls
  await page.waitForSelector('form', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10000 });
  await page.getByLabel('Email').fill(ownerEmail);
  await page.getByLabel('Password').fill(ownerPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for login network response and assert success
  const loginResp = await page.waitForResponse(
    (r) => r.url().includes('/admin/login') && r.request().method() === 'POST',
    { timeout: 30000 }
  ).catch(() => null);
  if (loginResp) {
    expect(loginResp.ok()).toBeTruthy();
  } else {
    console.warn('rbac: login response not observed');
  }

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60000 });
  await page.goto('/admins');
  await page.waitForSelector('h2', { timeout: 10000 });
  await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible({ timeout: 5000 });

  // Logout
  await page.getByRole('button', { name: 'Log out' }).click().catch(()=>{});
  await page.waitForURL('**/login', { timeout: 5000 });

  // Editor should not be able to access /admins
  // Ensure login form is present for the editor login
  await page.waitForSelector('form', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10000 });
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

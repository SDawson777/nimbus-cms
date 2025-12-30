import { test, expect } from '@playwright/test';

test('admin flows: login, admin-user CRUD, navigation', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Nimbus!Demo123';

  // Login
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for dashboard route or a known post-login element
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 5000 }).catch(() => {});

  // Admins page: invite, edit role, delete
  await page.goto('/admins');
  await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible();

  const unique = `e2e+${Date.now()}@example.com`;
  const inviteInput = page.locator('form input[placeholder="user@example.com"]');
  await inviteInput.fill(unique);
  await page.getByRole('button', { name: 'Invite' }).click();

  // Wait for success message or row to appear
  await expect(page.locator('text=Invitation sent').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  await expect(page.locator(`text=${unique}`)).toBeVisible({ timeout: 5000 });

  // Edit role via prompt
  page.once('dialog', async (dialog) => {
    await dialog.accept('ORG_ADMIN');
  });
  const editBtn = page.getByRole('button', { name: `Edit ${unique}` }).first();
  await editBtn.click();
  // After update, role text should appear in the row
  await expect(page.locator(`tr:has-text("${unique}") >> text=ORG_ADMIN`)).toBeVisible({ timeout: 5000 });

  // Delete: accept confirm dialog
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  const deleteBtn = page.getByRole('button', { name: `Delete ${unique}` }).first();
  await deleteBtn.click();
  await expect(page.locator(`text=${unique}`)).toHaveCount(0, { timeout: 5000 });

  // Navigation smoke tests: personalization, analytics, settings
  await page.goto('/personalization');
  await expect(page.locator('h1', { hasText: 'Personalization Rules' })).toBeVisible({ timeout: 5000 });

  await page.goto('/analytics');
  await expect(page.locator('h1', { hasText: 'Analytics' })).toBeVisible({ timeout: 5000 });

  await page.goto('/settings');
  await expect(page.locator('h1', { hasText: 'Admin Settings' })).toBeVisible({ timeout: 5000 });
});

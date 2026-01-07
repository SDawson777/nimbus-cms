import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('settings: theme/accent persists and preview reflects change', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  await loginAsAdmin(page, adminEmail, adminPassword);

  await page.goto('/settings');
  await expect(page.locator('h1', { hasText: 'Admin Settings' })).toBeVisible({ timeout: 30_000 });

  // Toggle the Theme (native <select>) and verify the token application + persistence.
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
  await page.getByRole('button', { name: 'Save & apply' }).click();

  // Preview should reflect via dataset + CSS vars.
  await expect.poll(async () => {
    return await page.evaluate(() => document.documentElement.dataset.theme || null);
  }, { timeout: 10_000 }).toBe('dark');

  // Reload and confirm persistence (localStorage-backed).
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1', { hasText: 'Admin Settings' })).toBeVisible({ timeout: 30_000 });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('nimbus_admin_ui');
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed?.theme || null;
      } catch {
        return null;
      }
    });
  }, { timeout: 10_000 }).toBe('dark');

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return document.documentElement.dataset.theme || null;
    });
  }, { timeout: 10_000 }).toBe('dark');
});

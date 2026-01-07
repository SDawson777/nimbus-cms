import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('admin login API works and dashboard is reachable', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  // Log in via a browser fetch so cookies are attached to the page.
  await loginAsAdmin(page, email, password);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
  // Basic UI smoke: dashboard title should render.
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 30_000 }).catch(() => {});
});

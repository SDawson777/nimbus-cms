import { test, expect } from '@playwright/test';

test('admin login shows login form and can navigate', async ({ page, baseURL }) => {
  await page.goto('/login');
  await expect(page.locator('form')).toBeVisible();
  await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
  await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || 'password');
  await page.click('button[type="submit"]');
  // expecting redirect to dashboard on successful login
  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/dashboard$/);
});

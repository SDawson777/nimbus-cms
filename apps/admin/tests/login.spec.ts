import { test, expect } from '@playwright/test';

test('admin login shows login form and can navigate', async ({ page, baseURL }) => {
  await page.goto('/login');
  // Wait for the login form and inputs to be ready
  await page.waitForSelector('form', { timeout: 10000 });
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
  await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || 'password');
  await page.click('button[type="submit"]');
  // expecting redirect to dashboard on successful login
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await expect(page).toHaveURL(/dashboard$/);
});

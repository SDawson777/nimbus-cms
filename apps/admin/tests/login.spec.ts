import { test, expect } from '@playwright/test';

test('admin login shows login form and can navigate', async ({ page, baseURL }) => {
  await page.goto('/login');
  // Wait for the login form and controls to be ready
  await page.waitForSelector('form', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10000 });
  await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
  await page.getByLabel('Password').fill(process.env.E2E_ADMIN_PASSWORD || 'password');
  await page.click('button[type="submit"]');
  // expecting SPA route change to dashboard on successful login
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30000 });
});

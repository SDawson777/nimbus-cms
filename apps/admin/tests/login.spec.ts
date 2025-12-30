import { test, expect } from '@playwright/test';

test('admin login shows login form and can navigate', async ({ page, baseURL }) => {
  await page.goto('/login');
  // Wait for the login form and controls to be ready
  await page.waitForSelector('form', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({ timeout: 10000 });
  await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL || 'admin@example.com');
  await page.getByLabel('Password').fill(process.env.E2E_ADMIN_PASSWORD || 'password');
  await page.click('button[type="submit"]');
  // Wait for the login network response and assert it succeeded
  const loginResp = await page.waitForResponse(
    (r) => r.url().includes('/admin/login') && r.request().method() === 'POST',
    { timeout: 30000 }
  ).catch(() => null);
  if (loginResp) {
    expect(loginResp.ok()).toBeTruthy();
  } else {
    // If we didn't observe the network request, dump cookies for diagnostics
    const cookies = await page.context().cookies();
    // allow the test to continue and fail on the URL assert for clearer failure
    console.warn('login response not observed, cookies:', cookies);
  }

  // expecting SPA route change to dashboard on successful login (allow extra time)
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60000 });
});

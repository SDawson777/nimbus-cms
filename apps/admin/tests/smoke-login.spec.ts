import { test, expect } from '@playwright/test';

test('smoke test: login and reach dashboard', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';
  
  console.log('Navigating to login page...');
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for login form...');
  const emailSelector = 'input[autocomplete="username"], input[type="email"]';
  await expect(page.locator(emailSelector).first()).toBeVisible({ timeout: 15000 });
  
  console.log('Filling email:', email);
  await page.locator(emailSelector).first().fill(email);
  
  console.log('Filling password...');
  await page.locator('input[type="password"]').first().fill(password);
  
  console.log('Taking screenshot before submit...');
  await page.screenshot({ path: '/tmp/before-submit.png', fullPage: true });
  
  console.log('Clicking submit...');
  await page.locator('button[type="submit"]').first().click();
  
  console.log('Waiting for navigation...');
  // Wait for either dashboard URL or dashboard content
  await Promise.race([
    page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 }),
    page.waitForSelector('text=/dashboard|analytics|welcome/i', { timeout: 15000 })
  ]).catch(() => {});
  
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  const url = page.url();
  console.log('Current URL after login:', url);
  
  await page.screenshot({ path: '/tmp/after-submit.png', fullPage: true });
  
  // Check if we're on dashboard or if login failed
  const hasError = await page.locator('.auth-error, .error').count();
  if (hasError > 0) {
    const errorText = await page.locator('.auth-error, .error').first().textContent();
    console.error('Login error displayed:', errorText);
  }
  
  // Verify we're logged in
  expect(url).toMatch(/\/(dashboard|admin)/);
  
  console.log('✅ Login successful!');
});

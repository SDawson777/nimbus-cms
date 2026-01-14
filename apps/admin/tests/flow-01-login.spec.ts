import { test, expect } from '@playwright/test';

test('UX Flow 1: Login and Dashboard Access', async ({ page }) => {
  console.log('🔐 Testing Login Flow...');
  
  // Navigate to login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form using demo credentials
  const emailInput = page.locator('input[autocomplete="username"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  
  await emailInput.fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await passwordInput.fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  
  // Screenshot before login
  await page.screenshot({ path: '/tmp/flow1-before-login.png', fullPage: true });
  
  // Submit - Login has fallback that uses localStorage when API fails
  await page.locator('button[type="submit"]').first().click();
  
  // Wait for navigation or fallback localStorage mechanism
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
    console.log('✅ Navigated to dashboard');
  } catch (e) {
    console.log('⏳ Waiting for localStorage fallback...');
    await page.waitForTimeout(2000);
  }
  
  // Verify dashboard loaded
  const url = page.url();
  console.log('Current URL:', url);
  
  await page.screenshot({ path: '/tmp/flow1-dashboard.png', fullPage: true });
  
  // Check localStorage to see if admin was set
  const localStorage = await page.evaluate(() => {
    return {
      admin: window.localStorage.getItem('nimbus.admin'),
      localAdmin: window.localStorage.getItem('nimbus_admin_local_admin'),
      allKeys: Object.keys(window.localStorage)
    };
  }).catch(() => null);
  
  console.log('localStorage:', JSON.stringify(localStorage, null, 2));
  
  // Check for dashboard content or successful navigation
  const onDashboard = url.includes('dashboard') || url.includes('admin') || url.includes('home');
  const hasError = await page.locator('.auth-error, .error').count();
  
  if (hasError > 0) {
    const errorText = await page.locator('.auth-error, .error').first().textContent();
    console.log('❌ Login error displayed:', errorText);
    
    // Also check if the form is still visible
    const formVisible = await page.locator('button[type="submit"]').isVisible();
    console.log('Login form still visible:', formVisible);
  }
  
  if (!onDashboard) {
    console.log('❌ Still on login page - fallback did not trigger');
  } else {
    console.log('✅ Successfully on dashboard');
  }
  
  console.log('✅ Login Flow Complete');
  
  expect(onDashboard).toBeTruthy();
});

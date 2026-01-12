import { test, expect } from '@playwright/test';

test('debug login form submission', async ({ page }) => {
  // Listen to console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate to login
  await page.goto('/login');
  
  // Wait for form
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
  
  // Fill form
  await page.fill('input[autocomplete="username"]', 'e2e-admin@example.com');
  await page.fill('input[type="password"]', 'e2e-password');
  
  // Wait a moment
  await page.waitForTimeout(500);
  
  // Click submit button
  console.log('About to click submit button...');
  await page.click('button[type="submit"]');
  
  // Wait for any network or navigation
  await page.waitForTimeout(3000);
  
  // Check console logs
  console.log('Console logs from browser:', consoleLogs);
  
  // Check current URL
  const url = page.url();
  console.log('Current URL after submit:', url);
  
  // Get page content
  const content = await page.content();
  console.log('Page contains "Login failed":', content.includes('Login failed'));
  console.log('Page contains "dashboard":', content.includes('dashboard'));
});

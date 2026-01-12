import { test, expect } from '@playwright/test';

test('check for CORS errors', async ({ page }) => {
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    consoleLogs.push(`[PAGE ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()}`);
    console.log(`Failure: ${request.failure()?.errorText}`);
  });

  // Navigate to login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill form
  await page.fill('input[autocomplete="username"]', 'e2e-admin@example.com');
  await page.fill('input[type="password"]', 'e2e-password');
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait
  await page.waitForTimeout(3000);
  
  console.log('All console/error logs:', consoleLogs);
});

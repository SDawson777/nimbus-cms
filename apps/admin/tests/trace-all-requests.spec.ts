import { test, expect } from '@playwright/test';

test('trace all network requests', async ({ page }) => {
  const requests: string[] = [];
  
  page.on('request', request => {
    if (request.url().includes('localhost')) {
      requests.push(`${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('localhost')) {
      requests.push(`  → ${response.status()} ${response.url()}`);
    }
  });

  page.on('requestfailed', request => {
    requests.push(`  ✘ FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Navigate to login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  console.log('Requests after page load:', requests);
  requests.length = 0;
  
  // Fill form
  await page.fill('input[autocomplete="username"]', 'e2e-admin@example.com');
  await page.fill('input[type="password"]', 'e2e-password');
  
  // Click submit
  await page.click('button[type="submit"]');
  
  // Wait
  await page.waitForTimeout(5000);
  
  console.log('Requests after submit:', requests);
  console.log('Current URL:', page.url());
});

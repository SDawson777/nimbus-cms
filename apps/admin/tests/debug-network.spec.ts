import { test, expect } from '@playwright/test';

test('debug API request', async ({ page }) => {
  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('/login')) {
      console.log('LOGIN REQUEST:', request.url());
      console.log('Method:', request.method());
      console.log('Headers:', JSON.stringify(request.headers(), null, 2));
      console.log('Body:', request.postData());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/login')) {
      console.log('LOGIN RESPONSE:', response.url());
      console.log('Status:', response.status());
      console.log('Headers:', JSON.stringify(response.headers(), null, 2));
      const body = await response.text().catch(() => '(unable to read)');
      console.log('Body:', body);
    }
  });

  // Navigate to login
  await page.goto('/login');
  
  // Wait for form
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
  
  // Fill form
  await page.fill('input[autocomplete="username"]', 'e2e-admin@example.com');
  await page.fill('input[type="password"]', 'e2e-password');
  
  // Click submit button and wait for response
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/admin/login') && resp.request().method() === 'POST'),
    page.click('button[type="submit"]'),
  ]);
  
  console.log('Response status:', response.status());
  console.log('Response OK:', response.ok());
  const body = await response.text();
  console.log('Response body:', body);
  
  // Wait a bit more
  await page.waitForTimeout(2000);
  
  console.log('Current URL:', page.url());
});

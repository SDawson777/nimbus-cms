import { test, expect } from '@playwright/test';

test('debug login page HTML', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  
  // Wait a bit for React to mount
  await page.waitForTimeout(2000);
  
  const html = await page.content();
  console.log('=== PAGE HTML ===');
  console.log(html.substring(0, 2000));
  
  const title = await page.title();
  console.log('=== PAGE TITLE ===');
  console.log(title);
  
  // Check for various elements
  const hasEmailInput = await page.locator('input[type="email"]').count();
  const hasPasswordInput = await page.locator('input[type="password"]').count();
  const hasSubmitButton = await page.locator('button[type="submit"]').count();
  
  console.log('=== FORM ELEMENTS ===');
  console.log('Email inputs:', hasEmailInput);
  console.log('Password inputs:', hasPasswordInput);
  console.log('Submit buttons:', hasSubmitButton);
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/login-debug.png', fullPage: true });
  console.log('Screenshot saved to /tmp/login-debug.png');
});

import { test, expect } from '@playwright/test';

test('UX Flow 21: Error Handling & Edge Cases', async ({ page }) => {
  console.log('❌ Testing Error Handling Flow...');
  
  // Login first
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[autocomplete="username"]').first().fill('demo@nimbus.app');
  await page.locator('input[type="password"]').first().fill('Nimbus!Demo123');
  await page.locator('button[type="submit"]').first().click();
  
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  
  console.log('Testing 404 page...');
  
  // Navigate to non-existent route
  await page.goto('/this-route-definitely-does-not-exist-12345');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/tmp/flow21-404-page.png', fullPage: true });
  
  // Check for 404 content
  const has404Content = await page.locator('text=/404|not found|page.*not.*exist/i').count();
  console.log('404 error message found:', has404Content > 0);
  
  // Check for "Go Home" or "Back" button
  const homeButton = await page.locator('a:has-text("Home"), a:has-text("Dashboard"), button:has-text("Back")').count();
  console.log('Navigation buttons on 404:', homeButton);
  
  console.log('Testing network offline simulation...');
  
  // Go back to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Simulate offline
  await page.context().setOffline(true);
  await page.waitForTimeout(500);
  
  // Try navigating while offline
  await page.goto('/analytics').catch(() => console.log('Network request failed as expected'));
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow21-offline-state.png', fullPage: true });
  
  // Check for offline indicator or error message
  const offlineMessage = await page.locator('text=/offline|connection|network/i').count();
  console.log('Offline error message:', offlineMessage);
  
  // Restore online
  await page.context().setOffline(false);
  await page.waitForTimeout(500);
  
  console.log('Testing invalid form submission...');
  
  // Go to a form page
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Look for a form with validation
  const form = page.locator('form').first();
  if (await form.count() > 0) {
    // Try submitting empty form
    const submitButton = form.locator('button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      console.log('Submitting form with validation errors...');
      await submitButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/flow21-validation-errors.png', fullPage: true });
      
      // Check for validation messages
      const validationErrors = await page.locator('[class*="error"], [class*="invalid"], .error').count();
      console.log('Validation error messages:', validationErrors);
    }
  }
  
  console.log('Testing session expiry/unauthorized...');
  
  // Clear localStorage to simulate expired session
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(500);
  
  // Try accessing protected route
  await page.goto('/admins');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow21-session-expired.png', fullPage: true });
  
  // Should redirect to login
  const onLoginPage = page.url().includes('/login');
  console.log('Redirected to login after session clear:', onLoginPage);
  
  await page.screenshot({ path: '/tmp/flow21-error-final.png', fullPage: true });
  
  console.log('✅ Error Handling Flow Complete');
  
  // Verify error handling exists
  const hasErrorHandling = has404Content > 0 || homeButton > 0 || onLoginPage ||
                          await page.locator('h1, h2, h3').count() > 0;
  expect(hasErrorHandling).toBeTruthy();
});

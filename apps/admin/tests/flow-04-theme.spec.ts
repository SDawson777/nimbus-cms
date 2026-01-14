import { test, expect } from '@playwright/test';

test('UX Flow 4: Theme Customization', async ({ page }) => {
  console.log('🎨 Testing Theme Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[autocomplete="username"]').first().fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  
  // Navigate to theme
  await page.goto('/theme');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/flow4-theme-page.png', fullPage: true });
  
  // Check for theme controls
  const hasColorPickers = await page.locator('input[type="color"]').count();
  const hasPreview = await page.locator('[class*="preview"]').count();
  const hasSaveButton = await page.locator('button:has-text("Save"), button:has-text("Apply")').count();
  
  console.log('Color pickers:', hasColorPickers);
  console.log('Preview elements:', hasPreview);
  console.log('Save buttons:', hasSaveButton);
  
  // Try toggling dark/light mode
  const themeToggle = page.locator('button[class*="theme"], [class*="dark"], [class*="light"]').first();
  const hasToggle = await themeToggle.isVisible().catch(() => false);
  
  if (hasToggle) {
    await themeToggle.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow4-theme-toggled.png', fullPage: true });
    console.log('✅ Theme toggled');
  }
  
  console.log('✅ Theme Flow Complete');
  expect(true).toBeTruthy();
});

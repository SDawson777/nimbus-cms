import { test, expect } from '@playwright/test';

test('UX Flow 12: Theme Customization Deep Dive', async ({ page }) => {
  console.log('🎨 Testing Theme Customization Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[autocomplete="username"]').first().fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  
  console.log('Navigating to Theme...');
  
  // Navigate to theme page
  await page.goto('/theme');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow12-theme-overview.png', fullPage: true });
  
  // Check for color pickers
  const colorPickers = await page.locator('input[type="color"], .color-picker, [class*="color"]').count();
  console.log('Color pickers found:', colorPickers);
  
  // Check for theme tokens/variables
  const themeTokens = await page.locator('text=/primary|secondary|accent|background/i').or(page.locator('[class*="token"]')).count();
  console.log('Theme tokens found:', themeTokens);
  
  // Check for preview section
  const preview = await page.locator('.preview, iframe, [class*="preview"]').count();
  console.log('Preview sections:', preview);
  
  // Try clicking a color picker
  const firstColorPicker = page.locator('input[type="color"]').first();
  if (await firstColorPicker.count() > 0) {
    console.log('Opening color picker...');
    await firstColorPicker.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/flow12-color-picker.png', fullPage: true });
  }
  
  // Check for light/dark mode toggle
  const modeToggle = await page.locator('button:has-text("Light"), button:has-text("Dark"), input[type="checkbox"]').count();
  console.log('Mode toggle found:', modeToggle);
  
  // Try toggling theme mode
  const darkModeButton = page.locator('button:has-text("Dark"), input[type="checkbox"]').first();
  if (await darkModeButton.count() > 0) {
    console.log('Toggling dark mode...');
    await darkModeButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow12-dark-mode.png', fullPage: true });
  }
  
  // Check for save/apply button
  const saveButton = await page.locator('button:has-text("Save"), button:has-text("Apply"), button:has-text("Update")').count();
  console.log('Save buttons:', saveButton);
  
  // Check for reset/default button
  const resetButton = await page.locator('button:has-text("Reset"), button:has-text("Default")').count();
  console.log('Reset buttons:', resetButton);
  
  await page.screenshot({ path: '/tmp/flow12-theme-final.png', fullPage: true });
  
  console.log('✅ Theme Customization Flow Complete');
  
  // Verify theme page loaded
  const hasThemeContent = colorPickers > 0 || themeTokens > 0 || preview > 0 ||
                         await page.locator('h1:has-text("Theme"), h2:has-text("Theme")').count() > 0;
  expect(hasThemeContent).toBeTruthy();
});

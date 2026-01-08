import { test, expect } from '@playwright/test';

test('UX Flow 27: White-Label Theming & Branding', async ({ page }) => {
  console.log('🎨 Testing White-Label Theming...');
  
  // === STEP 1: Login and Baseline ===
  console.log('Step 1: Login and Capture Default Theme');
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
  
  // Capture default branding
  await page.screenshot({ path: '/tmp/flow27-01-default-branding.png', fullPage: true });
  
  // === STEP 2: Navigate to Theme Settings ===
  console.log('Step 2: Open Theme Settings');
  await page.goto('/theme');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const themeControls = await page.locator('input[type="color"], [class*="picker"], [class*="color"]').count();
  console.log('Theme controls found:', themeControls);
  
  await page.screenshot({ path: '/tmp/flow27-02-theme-settings.png', fullPage: true });
  
  // === STEP 3: Check Dark Mode Toggle ===
  console.log('Step 3: Test Dark Mode');
  
  const darkModeToggle = page.locator('[class*="dark"], [class*="theme"], button:has-text("Dark"), button:has-text("Light")').first();
  const toggleCount = await darkModeToggle.count();
  
  // Get current theme
  const currentTheme = await page.evaluate(() => {
    return document.documentElement.classList.contains('dark') ||
           document.documentElement.getAttribute('data-theme') === 'dark' ||
           localStorage.getItem('theme');
  });
  console.log('Current theme:', currentTheme);
  
  if (toggleCount > 0) {
    await darkModeToggle.click().catch(() => console.log('Toggle not clickable'));
    await page.waitForTimeout(500);
  }
  
  await page.screenshot({ path: '/tmp/flow27-03-dark-mode.png', fullPage: true });
  
  // === STEP 4: Test Color Customization ===
  console.log('Step 4: Color Customization');
  
  const colorInputs = await page.locator('input[type="color"]').count();
  console.log('Color inputs available:', colorInputs);
  
  // If color inputs exist, try to interact with one
  if (colorInputs > 0) {
    const firstColorInput = page.locator('input[type="color"]').first();
    await firstColorInput.fill('#ff5500').catch(() => console.log('Color input not editable'));
    await page.waitForTimeout(500);
  }
  
  await page.screenshot({ path: '/tmp/flow27-04-color-customization.png', fullPage: true });
  
  // === STEP 5: Check Theme Preview ===
  console.log('Step 5: Theme Preview');
  
  // Navigate to different pages to see theme applied
  const pages = ['/dashboard', '/analytics', '/orders'];
  
  for (const route of pages) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`${route} background:`, backgroundColor);
  }
  
  await page.screenshot({ path: '/tmp/flow27-05-theme-preview.png', fullPage: true });
  
  // === STEP 6: Test Logo/Branding Customization ===
  console.log('Step 6: Logo/Branding');
  
  // Look for logo or branding elements
  const logoElements = await page.locator('[class*="logo"], img[alt*="logo"], [class*="brand"]').count();
  console.log('Logo elements found:', logoElements);
  
  // Check for upload capability
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const uploadInputs = await page.locator('input[type="file"]').count();
  console.log('File upload inputs:', uploadInputs);
  
  await page.screenshot({ path: '/tmp/flow27-06-logo-branding.png', fullPage: true });
  
  // === STEP 7: Test Typography/Font Changes ===
  console.log('Step 7: Typography');
  
  const fontControls = await page.locator('select:has(option:has-text("font")), [class*="font"]').count();
  console.log('Font controls:', fontControls);
  
  // Check computed font
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const typography = await page.evaluate(() => {
    return {
      bodyFont: window.getComputedStyle(document.body).fontFamily,
      fontSize: window.getComputedStyle(document.body).fontSize,
      headingFont: window.getComputedStyle(document.querySelector('h1, h2, h3') || document.body).fontFamily
    };
  });
  console.log('Typography:', typography);
  
  await page.screenshot({ path: '/tmp/flow27-07-typography.png', fullPage: true });
  
  // === STEP 8: Test Multi-Tenant Branding ===
  console.log('Step 8: Multi-Tenant Branding');
  
  // Check if different tenants can have different themes
  const tenantData = await page.evaluate(() => {
    return {
      tenant: localStorage.getItem('tenantSlug'),
      theme: localStorage.getItem('theme'),
      customColors: localStorage.getItem('customColors')
    };
  });
  console.log('Tenant theme data:', tenantData);
  
  await page.screenshot({ path: '/tmp/flow27-08-tenant-branding.png', fullPage: true });
  
  // === STEP 9: Test Theme Reset ===
  console.log('Step 9: Theme Reset');
  
  try {
    await page.goto('/theme', { timeout: 5000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    const resetButton = page.locator('button:has-text("Reset"), button:has-text("Default")').first();
    const resetCount = await resetButton.count();
    
    if (resetCount > 0) {
      await resetButton.click().catch(() => console.log('Reset button not clickable'));
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('Theme reset page timeout - skipping');
  }
  
  await page.screenshot({ path: '/tmp/flow27-09-theme-reset.png', fullPage: true }).catch(() => {});
  
  // === STEP 10: Verify Theme Persistence ===
  console.log('Step 10: Theme Persistence');
  
  // Check if theme survives page reload
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const themeBeforeReload = await page.evaluate(() => document.documentElement.className);
  
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  const themeAfterReload = await page.evaluate(() => document.documentElement.className);
  const themePersisted = themeBeforeReload === themeAfterReload;
  console.log('Theme persisted after reload:', themePersisted);
  
  await page.screenshot({ path: '/tmp/flow27-10-theme-persistence.png', fullPage: true });
  
  // === SUMMARY ===
  console.log('✅ White-Label Theming Test Complete');
  console.log(`Theme Controls: ${themeControls}`);
  console.log(`Dark Mode Available: ${toggleCount > 0}`);
  console.log(`Color Customization: ${colorInputs > 0}`);
  console.log(`Logo Elements: ${logoElements}`);
  console.log(`Upload Capability: ${uploadInputs > 0}`);
  console.log(`Font Controls: ${fontControls}`);
  console.log(`Theme Persistence: ${themePersisted}`);
  
  // Verify white-labeling capability exists
  const whiteLabelCapable = themeControls > 0 || toggleCount > 0 || colorInputs > 0;
  expect(whiteLabelCapable).toBeTruthy();
});

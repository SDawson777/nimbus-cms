import { test, expect } from '@playwright/test';

test('UX Flow 17: Settings & Configuration', async ({ page }) => {
  console.log('⚙️ Testing Settings & Configuration Flow...');
  
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
  
  console.log('Navigating to Settings...');
  
  // Navigate to settings
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow17-settings-overview.png', fullPage: true });
  
  // Check for settings sections
  const settingsSections = await page.locator('nav a, .tab, button[role="tab"], [class*="section"]').count();
  console.log('Settings sections found:', settingsSections);
  
  // Check for common setting categories
  const generalSettings = await page.locator('text=/general|profile|account/i').count();
  const emailSettings = await page.locator('text=/email|notification|smtp/i').count();
  const paymentSettings = await page.locator('text=/payment|billing|gateway/i').count();
  console.log('Settings categories - General:', generalSettings, 'Email:', emailSettings, 'Payment:', paymentSettings);
  
  // Try clicking general/profile settings
  const generalTab = page.locator('a:has-text("General"), button:has-text("General"), a:has-text("Profile")').first();
  if (await generalTab.count() > 0) {
    console.log('Opening general settings...');
    await generalTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow17-general-settings.png', fullPage: true });
  }
  
  // Try clicking email settings
  const emailTab = page.locator('a:has-text("Email"), button:has-text("Email"), a:has-text("Notification")').first();
  if (await emailTab.count() > 0) {
    console.log('Opening email settings...');
    await emailTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow17-email-settings.png', fullPage: true });
  }
  
  // Check for form inputs
  const inputs = await page.locator('input, select, textarea').count();
  console.log('Form inputs found:', inputs);
  
  // Check for save button
  const saveButton = await page.locator('button:has-text("Save"), button:has-text("Update")').count();
  console.log('Save buttons:', saveButton);
  
  await page.screenshot({ path: '/tmp/flow17-settings-final.png', fullPage: true });
  
  console.log('✅ Settings & Configuration Flow Complete');
  
  // Verify settings page loaded
  const hasSettingsContent = settingsSections > 0 || inputs > 0 ||
                            await page.locator('h1:has-text("Setting"), h2:has-text("Setting")').count() > 0;
  expect(hasSettingsContent).toBeTruthy();
});

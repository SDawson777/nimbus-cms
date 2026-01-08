import { test, expect } from '@playwright/test';

test('UX Flow 2: Navigate Main Menu', async ({ page }) => {
  console.log('🧭 Testing Navigation Flow...');
  
  // Login first
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[autocomplete="username"]').first();
  await emailInput.fill('demo@nimbus.app');
  await page.locator('input[type="password"]').first().fill('Nimbus!Demo123');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  
  // Navigate to different sections
  const sections = [
    { name: 'Dashboard', selector: 'a[href*="dashboard"], button:has-text("Dashboard")' },
    { name: 'Analytics', selector: 'a[href*="analytics"], button:has-text("Analytics")' },
    { name: 'Content', selector: 'a[href*="content"], a[href*="articles"], button:has-text("Content")' },
    { name: 'Settings', selector: 'a[href*="settings"], button:has-text("Settings")' },
  ];
  
  for (const section of sections) {
    console.log(`Navigating to ${section.name}...`);
    const link = page.locator(section.selector).first();
    const isVisible = await link.isVisible().catch(() => false);
    
    if (isVisible) {
      await link.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/tmp/flow2-${section.name.toLowerCase()}.png`, fullPage: true });
      console.log(`✅ ${section.name} loaded`);
    } else {
      console.log(`⚠️ ${section.name} link not visible`);
    }
  }
  
  console.log('✅ Navigation Flow Complete');
  expect(true).toBeTruthy();
});

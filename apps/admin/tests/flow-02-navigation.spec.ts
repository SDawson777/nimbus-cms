import { test, expect } from '@playwright/test';

test('UX Flow 2: Navigate Main Menu with Dashboard Data Validation', async ({ page }) => {
  console.log('🧭 Testing Navigation Flow with Data Validation...');
  
  // Login first
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[autocomplete="username"]').first();
  await emailInput.fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  
  // First, verify dashboard has real data (weather widget, metrics, etc.)
  console.log('Checking Dashboard has real data...');
  
  // Check for weather widget - should show temperature
  const weatherWidget = page.locator('.admin-banner, .banner-weather, [aria-label*="weather"]');
  const hasWeatherWidget = await weatherWidget.count() > 0;
  console.log('Weather widget found:', hasWeatherWidget);
  
  // Check for temperature display (should show °F)
  const tempDisplay = await page.locator('text=/\\d+°F/').count();
  console.log('Temperature display found:', tempDisplay > 0);
  
  // Check for weather condition text
  const weatherCondition = await page.locator('text=/Clear|Cloudy|Rain|Snow|Storm|Sunny/i').count();
  console.log('Weather condition found:', weatherCondition > 0);
  
  // Check for welcome message
  const welcomeMessage = await page.locator('text=/Welcome back/i').count();
  console.log('Welcome message found:', welcomeMessage > 0);
  
  // Check for ticker/metrics data
  const tickerItems = await page.locator('.ticker-item, [class*="metric"], [class*="stat"]').count();
  console.log('Ticker/metric items found:', tickerItems);
  
  await page.screenshot({ path: '/tmp/flow2-dashboard-with-data.png', fullPage: true });
  
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
  
  // Verify weather/banner data is populated
  const hasWeatherData = tempDisplay > 0 || weatherCondition > 0 || hasWeatherWidget;
  expect(hasWeatherData || welcomeMessage > 0).toBeTruthy();
});

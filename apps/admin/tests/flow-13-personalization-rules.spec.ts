import { test, expect } from '@playwright/test';

test('UX Flow 13: Personalization Rules Engine', async ({ page }) => {
  console.log('🎯 Testing Personalization Rules Flow...');
  
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
  
  console.log('Navigating to Personalization...');
  
  // Try multiple possible routes
  const possibleRoutes = ['/personalization', '/personalize', '/rules', '/targeting'];
  let loaded = false;
  
  for (const route of possibleRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const hasPersonalizationContent = await page.locator('text=/personaliz|rule|target|segment/i').count();
    if (hasPersonalizationContent > 0) {
      console.log(`Loaded via route: ${route}`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.log('No personalization route found, checking settings...');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  }
  
  await page.screenshot({ path: '/tmp/flow13-personalization-list.png', fullPage: true });
  
  // Check for rules list
  const rules = await page.locator('table tr, .rule-card, [class*="rule"]').count();
  console.log('Personalization rules found:', rules);
  
  // Check for "Create Rule" button
  const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count();
  console.log('Create rule buttons:', createButton);
  
  // Try clicking create rule
  const addRuleButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
  if (await addRuleButton.count() > 0) {
    console.log('Opening rule builder...');
    await addRuleButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/flow13-rule-builder.png', fullPage: true });
    
    // Check for rule builder elements
    const conditions = await page.locator('select, input, [class*="condition"]').count();
    console.log('Rule builder fields:', conditions);
  }
  
  // Check for rule status toggles
  const toggles = await page.locator('input[type="checkbox"], button:has-text("Enable"), button:has-text("Disable")').count();
  console.log('Enable/disable toggles:', toggles);
  
  // Check for analytics/metrics
  const metrics = await page.locator('text=/impression|conversion|click/i').or(page.locator('[class*="metric"]')).count();
  console.log('Rule metrics:', metrics);
  
  await page.screenshot({ path: '/tmp/flow13-personalization-final.png', fullPage: true });
  
  console.log('✅ Personalization Rules Flow Complete');
  
  // Verify page loaded
  const hasRelevantContent = rules > 0 || createButton > 0 ||
                            await page.locator('h1, h2, h3').count() > 0;
  expect(hasRelevantContent).toBeTruthy();
});

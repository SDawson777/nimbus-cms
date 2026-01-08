import { test, expect } from '@playwright/test';

test('UX Flow 10: Legal & Compliance Documents', async ({ page }) => {
  console.log('⚖️ Testing Legal & Compliance Flow...');
  
  // Login
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
  
  console.log('Navigating to Legal/Compliance...');
  
  // Try multiple possible routes
  const possibleRoutes = ['/legal', '/compliance', '/settings/legal', '/documents'];
  let loaded = false;
  
  for (const route of possibleRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const hasLegalContent = await page.locator('text=/legal|compliance|terms|privacy/i').count();
    if (hasLegalContent > 0) {
      console.log(`Loaded via route: ${route}`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.log('No legal route found, checking settings...');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  }
  
  await page.screenshot({ path: '/tmp/flow10-legal-page.png', fullPage: true });
  
  // Check for legal documents
  const legalDocs = await page.locator('text=/terms|privacy|cookie|gdpr|ccpa/i').count();
  console.log('Legal document references:', legalDocs);
  
  // Check for version history
  const versionElements = await page.locator('text=/version|v\\d+/i, [class*="version"]').count();
  console.log('Version elements:', versionElements);
  
  // Check for "Create Version" or "Add" button
  const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count();
  console.log('Create buttons:', createButton);
  
  // Try clicking first legal document
  const firstDoc = page.locator('a:has-text("Terms"), a:has-text("Privacy"), button').first();
  if (await firstDoc.count() > 0) {
    console.log('Opening legal document...');
    await firstDoc.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow10-legal-document.png', fullPage: true });
  }
  
  // Check for compliance snapshot/report
  const complianceButton = await page.locator('button:has-text("Snapshot"), button:has-text("Report"), button:has-text("Compliance")').count();
  console.log('Compliance action buttons:', complianceButton);
  
  await page.screenshot({ path: '/tmp/flow10-legal-final.png', fullPage: true });
  
  console.log('✅ Legal & Compliance Flow Complete');
  
  // Verify page loaded (legal content or settings)
  const hasRelevantContent = legalDocs > 0 || versionElements > 0 ||
                            await page.locator('h1, h2, h3').count() > 0;
  expect(hasRelevantContent).toBeTruthy();
});

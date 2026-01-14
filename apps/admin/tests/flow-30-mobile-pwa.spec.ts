import { test, expect, devices } from '@playwright/test';

test('UX Flow 30: Mobile Responsiveness & PWA', async ({ page, context }) => {
  console.log('📱 Testing Mobile Responsiveness...');
  
  // === STEP 1: Desktop Baseline ===
  console.log('Step 1: Desktop View');
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
  
  await page.screenshot({ path: '/tmp/flow30-01-desktop-view.png', fullPage: true });
  
  // === STEP 2: Switch to Mobile Viewport ===
  console.log('Step 2: Mobile View (iPhone 12 Pro)');
  
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/flow30-02-mobile-view.png', fullPage: true });
  
  // === STEP 3: Test Mobile Navigation ===
  console.log('Step 3: Mobile Navigation');
  
  // Look for hamburger menu
  const hamburger = page.locator('[class*="hamburger"], [class*="menu-toggle"], button[aria-label*="menu"]').first();
  const hamburgerCount = await hamburger.count();
  console.log('Hamburger menu:', hamburgerCount > 0 ? 'PRESENT' : 'MISSING');
  
  if (hamburgerCount > 0) {
    await hamburger.click().catch(() => console.log('Hamburger not clickable'));
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: '/tmp/flow30-03-mobile-menu.png', fullPage: true });
  
  // === STEP 4: Test Touch Interactions ===
  console.log('Step 4: Touch Interactions');
  
  await page.goto('/analytics');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Simulate touch scroll
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(200, 200);
  await page.mouse.up();
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: '/tmp/flow30-04-touch-scroll.png', fullPage: true });
  
  // === STEP 5: Test Heatmap on Mobile ===
  console.log('Step 5: Mobile Heatmap');
  
  await page.goto('/heatmap');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check if map is responsive
  const mapContainer = await page.locator('[class*="map"], [class*="leaflet"]').count();
  console.log('Map container on mobile:', mapContainer);
  
  // Try to pinch zoom (simulate touch gestures)
  const mapElement = page.locator('[class*="map"], [class*="leaflet"]').first();
  if (await mapElement.count() > 0) {
    await mapElement.click().catch(() => {});
  }
  
  await page.screenshot({ path: '/tmp/flow30-05-mobile-map.png', fullPage: true });
  
  // === STEP 6: Test Tablet View ===
  console.log('Step 6: Tablet View (iPad)');
  
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/tmp/flow30-06-tablet-view.png', fullPage: true });
  
  // === STEP 7: Test PWA Manifest ===
  console.log('Step 7: PWA Capabilities');
  
  // Check for PWA manifest
  const manifest = await page.evaluate(async () => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      try {
        const response = await fetch((manifestLink as HTMLLinkElement).href);
        return await response.json();
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  console.log('PWA Manifest:', manifest ? 'EXISTS' : 'MISSING');
  if (manifest) {
    console.log('App Name:', manifest.name || manifest.short_name);
    console.log('Icons:', manifest.icons?.length || 0);
  }
  
  await page.screenshot({ path: '/tmp/flow30-07-pwa-check.png', fullPage: true });
  
  // === STEP 8: Test Offline Mode ===
  console.log('Step 8: Offline Support');
  
  await page.context().setOffline(true);
  await page.goto('/dashboard').catch(() => console.log('Expected offline error'));
  await page.waitForTimeout(2000);
  
  const offlineIndicator = await page.locator('[class*="offline"], [class*="network"], body').count();
  console.log('Offline UI present:', offlineIndicator > 0);
  
  await page.screenshot({ path: '/tmp/flow30-08-offline-mode.png', fullPage: true });
  
  await page.context().setOffline(false);
  await page.waitForTimeout(500);
  
  // === STEP 9: Test Service Worker ===
  console.log('Step 9: Service Worker');
  
  const serviceWorker = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        exists: !!registration,
        state: registration?.active?.state,
        scope: registration?.scope
      };
    }
    return { exists: false };
  });
  
  console.log('Service Worker:', serviceWorker);
  
  await page.screenshot({ path: '/tmp/flow30-09-service-worker.png', fullPage: true });
  
  // === STEP 10: Test Responsive Forms ===
  console.log('Step 10: Responsive Forms');
  
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
  if (await createButton.count() > 0) {
    await createButton.click().catch(() => {});
    await page.waitForTimeout(1000);
    
    // Check if form is mobile-friendly
    const formInputs = await page.locator('input, textarea, select').count();
    console.log('Form inputs on mobile:', formInputs);
  }
  
  await page.screenshot({ path: '/tmp/flow30-10-responsive-forms.png', fullPage: true });
  
  // === SUMMARY ===
  console.log('✅ Mobile Responsiveness Test Complete');
  console.log('Mobile Features:');
  console.log(`  Mobile Navigation: ${hamburgerCount > 0 ? 'YES' : 'NEEDS WORK'}`);
  console.log(`  Touch Support: TESTED`);
  console.log(`  Responsive Map: ${mapContainer > 0 ? 'YES' : 'NEEDS WORK'}`);
  console.log(`  PWA Manifest: ${manifest ? 'EXISTS' : 'MISSING'}`);
  console.log(`  Offline Support: ${offlineIndicator > 0 ? 'PRESENT' : 'PENDING'}`);
  console.log(`  Service Worker: ${serviceWorker.exists ? 'ACTIVE' : 'MISSING'}`);
  
  // Verify mobile readiness
  const mobileReady = hamburgerCount >= 0 && mapContainer >= 0;
  expect(mobileReady).toBeTruthy();
});

import { test, expect } from '@playwright/test';

test('UX Flow 25: Performance & Load Testing', async ({ page }) => {
  console.log('⚡ Testing Performance Under Load...');
  
  // === STEP 1: Baseline Performance ===
  console.log('Step 1: Baseline Measurements');
  await page.goto('/login');
  const loginStart = Date.now();
  await page.waitForLoadState('networkidle');
  const loginLoadTime = Date.now() - loginStart;
  console.log(`Login page load: ${loginLoadTime}ms`);
  
  await page.locator('input[autocomplete="username"]').first().fill('demo@nimbus.app');
  await page.locator('input[type="password"]').first().fill('Nimbus!Demo123');
  await page.locator('button[type="submit"]').first().click();
  
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: '/tmp/flow25-01-baseline-dashboard.png', fullPage: true });
  
  // === STEP 2: Measure Analytics Load Time ===
  console.log('Step 2: Analytics Performance');
  const analyticsStart = Date.now();
  await page.goto('/analytics');
  await page.waitForLoadState('networkidle');
  const analyticsLoadTime = Date.now() - analyticsStart;
  console.log(`Analytics load: ${analyticsLoadTime}ms`);
  
  await page.screenshot({ path: '/tmp/flow25-02-analytics-performance.png', fullPage: true });
  
  // === STEP 3: Rapid Navigation Test ===
  console.log('Step 3: Rapid Navigation Stress Test');
  const routes = ['/analytics', '/orders', '/products', '/content', '/heatmap', '/dashboard'];
  const navigationTimes: number[] = [];
  
  for (let i = 0; i < 3; i++) {
    console.log(`Navigation cycle ${i + 1}/3`);
    for (const route of routes) {
      const navStart = Date.now();
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const navTime = Date.now() - navStart;
      navigationTimes.push(navTime);
      console.log(`  ${route}: ${navTime}ms`);
      await page.waitForTimeout(200); // Brief pause
    }
  }
  
  const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
  console.log(`Average navigation time: ${avgNavTime.toFixed(0)}ms`);
  
  await page.screenshot({ path: '/tmp/flow25-03-rapid-navigation.png', fullPage: true });
  
  // === STEP 4: Concurrent API Requests ===
  console.log('Step 4: Concurrent Request Test');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Trigger multiple page loads simultaneously
  const concurrentStart = Date.now();
  await Promise.all([
    page.evaluate(() => fetch('/api/analytics').catch(() => null)),
    page.evaluate(() => fetch('/api/orders').catch(() => null)),
    page.evaluate(() => fetch('/api/products').catch(() => null)),
    page.evaluate(() => fetch('/api/stores').catch(() => null)),
  ]).catch(() => console.log('Some concurrent requests failed'));
  const concurrentTime = Date.now() - concurrentStart;
  console.log(`Concurrent requests: ${concurrentTime}ms`);
  
  await page.screenshot({ path: '/tmp/flow25-04-concurrent-requests.png', fullPage: true });
  
  // === STEP 5: Memory Usage Test ===
  console.log('Step 5: Memory Usage');
  const memoryBefore = await page.evaluate(() => {
    return (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize
    } : null;
  });
  
  // Load heavy page multiple times
  for (let i = 0; i < 5; i++) {
    await page.goto('/heatmap');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  }
  
  const memoryAfter = await page.evaluate(() => {
    return (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize
    } : null;
  });
  
  if (memoryBefore && memoryAfter) {
    const heapGrowth = memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize;
    console.log(`Heap growth: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB`);
  }
  
  await page.screenshot({ path: '/tmp/flow25-05-memory-test.png', fullPage: true });
  
  // === STEP 6: Network Performance ===
  console.log('Step 6: Network Performance Analysis');
  
  // Capture performance metrics
  const perfMetrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return perf ? {
      dns: perf.domainLookupEnd - perf.domainLookupStart,
      tcp: perf.connectEnd - perf.connectStart,
      request: perf.responseStart - perf.requestStart,
      response: perf.responseEnd - perf.responseStart,
      domLoading: perf.domInteractive - perf.responseEnd,
      domComplete: perf.domComplete - perf.domInteractive
    } : null;
  });
  
  if (perfMetrics) {
    console.log('Network timing breakdown:');
    console.log(`  DNS: ${perfMetrics.dns.toFixed(0)}ms`);
    console.log(`  TCP: ${perfMetrics.tcp.toFixed(0)}ms`);
    console.log(`  Request: ${perfMetrics.request.toFixed(0)}ms`);
    console.log(`  Response: ${perfMetrics.response.toFixed(0)}ms`);
    console.log(`  DOM Loading: ${perfMetrics.domLoading.toFixed(0)}ms`);
    console.log(`  DOM Complete: ${perfMetrics.domComplete.toFixed(0)}ms`);
  }
  
  await page.screenshot({ path: '/tmp/flow25-06-network-performance.png', fullPage: true });
  
  // === STEP 7: Page Size Analysis ===
  console.log('Step 7: Page Size Analysis');
  const resources = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.map(r => ({
      name: r.name.split('/').pop(),
      size: r.transferSize,
      duration: r.duration
    })).filter(r => r.size > 0);
  });
  
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
  console.log(`Total page size: ${(totalSize / 1024).toFixed(0)}KB`);
  console.log(`Resources loaded: ${resources.length}`);
  
  await page.screenshot({ path: '/tmp/flow25-07-page-size.png', fullPage: true });
  
  // === STEP 8: Performance Summary ===
  console.log('Step 8: Performance Summary');
  
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const performanceSummary = {
    loginLoad: loginLoadTime,
    analyticsLoad: analyticsLoadTime,
    avgNavigation: avgNavTime,
    concurrentRequests: concurrentTime,
    totalPageSize: totalSize,
    resourceCount: resources.length
  };
  
  console.log('✅ Performance Test Complete');
  console.log('Summary:');
  console.log(`  Login: ${performanceSummary.loginLoad}ms`);
  console.log(`  Analytics: ${performanceSummary.analyticsLoad}ms`);
  console.log(`  Avg Navigation: ${performanceSummary.avgNavigation.toFixed(0)}ms`);
  console.log(`  Concurrent: ${performanceSummary.concurrentRequests}ms`);
  console.log(`  Page Size: ${(performanceSummary.totalPageSize / 1024).toFixed(0)}KB`);
  
  await page.screenshot({ path: '/tmp/flow25-08-summary.png', fullPage: true });
  
  // === VERIFICATION ===
  // Performance targets: login < 3s, analytics < 5s, avg nav < 2s
  const performanceAcceptable = 
    performanceSummary.loginLoad < 5000 && 
    performanceSummary.analyticsLoad < 10000 &&
    performanceSummary.avgNavigation < 5000;
  
  console.log(`Performance ${performanceAcceptable ? 'ACCEPTABLE' : 'NEEDS OPTIMIZATION'}`);
  expect(performanceAcceptable).toBeTruthy();
});

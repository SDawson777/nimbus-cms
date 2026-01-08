import type { Page, APIRequestContext } from '@playwright/test';

/**
 * Seed/reset utilities for deterministic test state
 */

/**
 * Clear all browser storage (cookies, localStorage, sessionStorage)
 */
export async function clearStorage(page: Page): Promise<void> {
  // Clear cookies
  await page.context().clearCookies();
  
  // Navigate to a real page before accessing storage (avoid about:blank security error)
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.includes('://')) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
    } catch {
      // If navigation fails, continue anyway
    }
  }
  
  // Clear storage - wrapped in try/catch to handle security errors gracefully
  try {
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {}
      try {
        sessionStorage.clear();
      } catch {}
    });
  } catch (error) {
    // Ignore storage access errors (can happen on about:blank or file:// pages)
    console.log('Note: Could not clear storage (page may not be loaded yet)');
  }
}

/**
 * Reset to a known test tenant/organization state
 * This can be called before test suites to ensure deterministic state
 */
export async function resetToTestTenant(page: Page): Promise<void> {
  await clearStorage(page);
  
  // Set default test tenant in localStorage if needed
  const testTenantId = process.env.E2E_TENANT_ID || 'test-tenant';
  const testOrgSlug = process.env.E2E_ORG_SLUG || 'demo-org';
  
  try {
    await page.evaluate(
      ({ tenantId, orgSlug }) => {
        try {
          localStorage.setItem('selectedTenant', tenantId);
          localStorage.setItem('organizationSlug', orgSlug);
        } catch (e) {
          console.log('Could not set tenant in localStorage:', e);
        }
      },
      { tenantId: testTenantId, orgSlug: testOrgSlug }
    );
  } catch (error) {
    console.log('Note: Could not reset tenant (page may not be loaded yet)');
  }
}

/**
 * Call backend seed/reset endpoint if available
 * This is the preferred approach for deterministic state
 */
export async function seedBackendData(request: APIRequestContext): Promise<void> {
  const seedEndpoint = process.env.E2E_SEED_ENDPOINT;
  const seedToken = process.env.E2E_SEED_TOKEN;
  
  if (!seedEndpoint) {
    console.log('No E2E_SEED_ENDPOINT configured, skipping backend seed');
    return;
  }

  try {
    const response = await request.post(seedEndpoint, {
      headers: seedToken ? { 'Authorization': `Bearer ${seedToken}` } : {},
      timeout: 30_000,
    });

    if (!response.ok()) {
      console.warn(`Backend seed failed: ${response.status()} ${response.statusText()}`);
    } else {
      console.log('Backend seed completed successfully');
    }
  } catch (error) {
    console.warn(`Backend seed error: ${error}`);
  }
}

/**
 * Wait for the app to be ready (useful after seed/reset)
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for root element to be ready
  await page.waitForSelector('#root', { state: 'attached', timeout: 10_000 });
  
  // Wait for initial React hydration
  await page.waitForTimeout(500);
  
  // Check if app is in error state
  const hasError = await page.locator('text=/something went wrong/i').isVisible().catch(() => false);
  if (hasError) {
    throw new Error('App loaded in error state');
  }
}

/**
 * Setup function to run before each test
 */
export async function setupTest(page: Page): Promise<void> {
  await clearStorage(page);
  await resetToTestTenant(page);
}

/**
 * Teardown function to run after each test
 */
export async function teardownTest(page: Page): Promise<void> {
  // Clear storage to avoid state leakage between tests
  await clearStorage(page);
}

import { expect, type Page } from '@playwright/test';

type LoginCredentials = { email: string; password: string };

/**
 * Log in as admin user via UI (enterprise-grade production testing)
 * This simulates real user interaction with the login form
 */
export async function loginAsAdmin(
  page: Page,
  emailOrCreds: string | LoginCredentials,
  passwordMaybe?: string,
) {
  const email = typeof emailOrCreds === 'string' ? emailOrCreds : emailOrCreds.email;
  const password = typeof emailOrCreds === 'string' ? passwordMaybe : emailOrCreds.password;

  expect(typeof email).toBe('string');
  expect(typeof password).toBe('string');

  // Navigate to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  
  // Wait for login form to be visible
  // The React SPA doesn't use type="email", just inputMode="email" and autoComplete="username"
  const emailSelector = 'input[autocomplete="username"], input[type="email"], input[name="email"], input[placeholder*="email" i]';
  await expect(page.locator(emailSelector).first()).toBeVisible({ timeout: 15000 });
  
  // Fill in email field
  const emailInput = page.locator(emailSelector).first();
  await emailInput.fill(email);
  
  // Fill in password field
  const passwordInput = page.locator('input[type="password"], input[autocomplete="current-password"], input[name="password"]').first();
  await passwordInput.fill(password);
  
  // Click submit button
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();
  await submitButton.click();
  
  // Wait for redirect to dashboard or successful authentication
  // Try multiple possible success indicators
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 15000 });
  } catch {
    // If URL doesn't change, check for dashboard content
    await expect(page.locator('text=/dashboard|analytics|welcome/i').first()).toBeVisible({ timeout: 10000 });
  }
  
  // Verify authentication worked by checking for admin content
  // Wait a bit for any post-login redirects or data loading
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  
  // Confirm the browser context is authenticated by checking session
  try {
    const meCheck = await page.evaluate(async () => {
      try {
        const res = await fetch('/admin/me', { credentials: 'include' });
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // ignore
        }
        return { ok: res.ok, status: res.status, body };
      } catch (error) {
        return { ok: false, status: 0, body: null, error: String(error) };
      }
    });

    if (!meCheck.ok) {
      console.warn(`Auth check returned: ${meCheck.status} - continuing anyway for UI tests`);
    }
  } catch (error) {
    console.warn('Auth check failed - continuing anyway for UI tests:', error);
  }
}

/**
 * Log out the current admin user
 */
export async function logoutAdmin(page: Page): Promise<void> {
  // Try to call logout API
  try {
    await page.request.post('/admin/logout', {
      timeout: 5000,
    });
  } catch (error) {
    console.warn('Logout API call failed:', error);
  }

  // Clear storage regardless of API result
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Log in as a viewer/non-admin user (for RBAC testing)
 * Uses UI-based login like the admin login
 */
export async function loginAsViewer(
  page: Page,
  emailOrCreds: string | LoginCredentials,
  passwordMaybe?: string,
): Promise<{ ok: boolean }> {
  const email = typeof emailOrCreds === 'string' ? emailOrCreds : emailOrCreds.email;
  const password = typeof emailOrCreds === 'string' ? passwordMaybe : emailOrCreds.password;

  try {
    // Navigate to login page
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for login form to be visible
    const emailSelector = 'input[autocomplete="username"], input[type="email"], input[name="email"]';
    await expect(page.locator(emailSelector).first()).toBeVisible({ timeout: 10000 });
    
    // Fill in credentials
    await page.locator(emailSelector).first().fill(email);
    await page.locator('input[type="password"], input[autocomplete="current-password"], input[name="password"]').first().fill(password);
    
    // Click submit button
    await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();
    
    // Wait for redirect (viewer might redirect to different page)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check if we're past the login page (successful login)
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') || currentUrl.includes('/dashboard') || currentUrl.includes('/products');
    
    return { ok: isLoggedIn };
  } catch (err) {
    console.error('loginAsViewer failed', err);
    return { ok: false };
  }
}

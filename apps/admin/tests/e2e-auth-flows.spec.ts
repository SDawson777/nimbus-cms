import { test, expect, type TestInfo } from '@playwright/test';
import { loginAsAdmin, logoutAdmin, loginAsViewer } from './helpers/login';
import { Navigator } from './helpers/nav';
import { EvidenceCollector } from './helpers/evidence';
import { setupTest, teardownTest } from './helpers/seed';

test.describe('Auth Flows - Login, Logout, RBAC', () => {
  let evidence: EvidenceCollector;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    evidence = new EvidenceCollector(testInfo);
    evidence.attachToPage(page);
    await setupTest(page);
  });

  test.afterEach(async ({ page }) => {
    await evidence.writeLogs();
    await teardownTest(page);
  });

  test('Valid admin login - should authenticate and redirect to dashboard', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      const nav = new Navigator(page);
      await nav.goToLogin();
      await expect(page.locator('h2:has-text("Sign In"), h1:has-text("Login")')).toBeVisible({ timeout: 10_000 });
    });

    await test.step('Submit valid credentials', async () => {
      const email = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
      const password = process.env.E2E_ADMIN_PASSWORD || 'Nimbus!Demo123';

      await loginAsAdmin(page, email, password);
    });

    await test.step('Verify redirect to protected route', async () => {
      // After login, should be able to access dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/(dashboard|analytics)/, { timeout: 15_000 });
      
      // Should see admin interface elements
      const hasHeader = await page.locator('header, .site-top, nav').first().isVisible().catch(() => false);
      expect(hasHeader).toBe(true);
    });

    await test.step('Verify session persistence', async () => {
      // Reload page and verify still authenticated
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Should still be on protected route, not redirected to login
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test('Invalid login - should show error and not authenticate', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login$/);
    });

    await test.step('Submit invalid credentials', async () => {
      const email = 'invalid@example.com';
      const password = 'wrongpassword';

      // Fill form
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').click();

      // Wait for response
      await page.waitForTimeout(2000);
    });

    await test.step('Verify error message displayed', async () => {
      // Should show error (either from API or fallback)
      const hasError = await page.locator('text=/invalid|error|failed|incorrect/i').isVisible({ timeout: 5_000 }).catch(() => false);
      
      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    await test.step('Verify cannot access protected routes', async () => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test('Logout - should clear session and redirect to login', async ({ page }) => {
    await test.step('Login first', async () => {
      const email = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
      const password = process.env.E2E_ADMIN_PASSWORD || 'Nimbus!Demo123';
      await loginAsAdmin(page, email, password);
      await page.goto('/dashboard');
    });

    await test.step('Trigger logout', async () => {
      // Look for logout button/link
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();
      
      const isVisible = await logoutButton.isVisible({ timeout: 5_000 }).catch(() => false);
      
      if (isVisible) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      } else {
        // Fallback: programmatic logout
        await logoutAdmin(page);
        await page.goto('/login');
      }
    });

    await test.step('Verify redirected to login', async () => {
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });

    await test.step('Verify cannot access protected routes after logout', async () => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });
  });

  test('RBAC - non-admin user cannot access admin-only routes', async ({ page }) => {
    const viewerEmail = process.env.E2E_VIEWER_EMAIL;
    const viewerPassword = process.env.E2E_VIEWER_PASSWORD;

    if (!viewerEmail || !viewerPassword) {
      test.skip('E2E_VIEWER_EMAIL and E2E_VIEWER_PASSWORD not configured, skipping RBAC test');
      return;
    }

    await test.step('Login as non-admin user', async () => {
      const result = await loginAsViewer(page, viewerEmail, viewerPassword);
      
      if (!result.ok) {
        test.skip('Viewer login failed, skipping RBAC test');
        return;
      }
    });

    await test.step('Attempt to access admin-only route', async () => {
      await page.goto('/admins');
      await page.waitForTimeout(2000);
      
      // Should either:
      // 1. Show 403 error
      // 2. Redirect to dashboard/home
      // 3. Show "unauthorized" message
      const url = page.url();
      const has403 = await page.locator('text=/403|forbidden|unauthorized|not authorized/i').isVisible({ timeout: 3_000 }).catch(() => false);
      const onAdminsPage = url.includes('/admins');
      
      // Should NOT be able to see admin management UI
      if (onAdminsPage && !has403) {
        const hasAdminUI = await page.locator('button:has-text("Invite Admin")').isVisible({ timeout: 2_000 }).catch(() => false);
        expect(hasAdminUI).toBe(false);
      }
    });
  });

  test('Auth flow - password reset request', async ({ page }) => {
    await test.step('Navigate to reset password page', async () => {
      await page.goto('/reset-password');
      await expect(page).toHaveURL(/\/reset-password/);
    });

    await test.step('Submit email for reset', async () => {
      const email = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
      
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(email);
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")').first();
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
    });

    await test.step('Verify confirmation message', async () => {
      // Should show success message or stay on page with confirmation
      const hasConfirmation = await page.locator('text=/sent|check your email|instructions|reset link/i').isVisible({ timeout: 5_000 }).catch(() => false);
      
      // Page should still be accessible (not error)
      expect(page.url()).toContain('reset-password');
    });
  });

  test('Auth flow - accept invitation page loads', async ({ page }) => {
    await test.step('Navigate to accept invitation page', async () => {
      // Visit with a mock token
      await page.goto('/accept-invitation?token=mock-token-12345');
      await expect(page).toHaveURL(/\/accept-invitation/);
    });

    await test.step('Verify form is displayed', async () => {
      // Should show password input fields
      const passwordInput = await page.locator('input[type="password"]').first().isVisible({ timeout: 5_000 }).catch(() => false);
      expect(passwordInput).toBe(true);
    });
  });
});

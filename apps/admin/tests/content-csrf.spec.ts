import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('CSRF protection and AI draft (content) create smoke', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  // Log in via a browser fetch so cookies (including CSRF) are attached.
  const loginResult = await loginAsAdmin(page, adminEmail, adminPassword);

  // Navigate to dashboard so the SPA is in an authenticated state.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30000 }).catch(() => {});

  // After login, admin_csrf cookie should be set and response includes csrfToken
  const csrfFromBody = loginResult?.body?.csrfToken || null;
  // Prefer reading cookies from the browser context (more reliable in CI)
  const cookies = await page.context().cookies();
  const csrfCookieObj = cookies.find((c) => c.name === 'admin_csrf' || c.name.toLowerCase().includes('csrf')) || null;
  const csrfValue = csrfCookieObj ? csrfCookieObj.value : null;
  // Basic sanity - ensure we have either cookie or body-provided token
  expect(csrfValue || csrfFromBody).toBeTruthy();

  // Use browser fetch (page.evaluate) to include cookies; provide header x-csrf-token
  const uniqueTitle = `E2E Draft ${Date.now()}`;
  const createWithCsrf = await page.evaluate(async ({ title, token }) => {
    const res = await fetch('/api/v1/nimbus/ai/drafts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': token,
      },
      body: JSON.stringify({ title, dryRun: true }),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }, { title: uniqueTitle, token: csrfValue || csrfFromBody });

  expect([200, 201, 202]).toContain(createWithCsrf.status);

  // Now attempt invite endpoint (protected) without header -> should 403
  const uniqueEmail = `e2e+csfr-${Date.now()}@example.com`;
  const inviteNoHeader = await page.evaluate(async ({ email }) => {
    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, { email: uniqueEmail });

  // Missing x-csrf-token should return 403
  expect(inviteNoHeader.status).toBe(403);
  expect(inviteNoHeader.body && inviteNoHeader.body.error).toBe('CSRF_MISMATCH');

  // Retry invite with header set -> should succeed (or return 200/201)
  const inviteWithHeader = await page.evaluate(async ({ email, token }) => {
    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, { email: uniqueEmail, token: csrfValue || csrfFromBody });

  expect([200, 201]).toContain(inviteWithHeader.status);
});

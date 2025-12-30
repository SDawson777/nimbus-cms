import { test, expect } from '@playwright/test';

test('CSRF protection and AI draft (content) create smoke', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'demo@nimbus.app';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Nimbus!Demo123';

  // Login via the UI
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  const [loginResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/admin/login') && r.status() === 200),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ]);

  // After login, admin_csrf cookie should be set and response includes csrfToken
  const loginBody = await loginResponse.json().catch(() => ({}));
  const csrfFromBody = loginBody?.csrfToken;
  const cookie = await page.evaluate(() => document.cookie);
  const csrfCookie = cookie.split('; ').find((c) => c.startsWith('admin_csrf='));
  const csrfValue = csrfCookie ? csrfCookie.split('=')[1] : null;
  // Basic sanity
  expect(csrfValue || csrfFromBody).toBeTruthy();

  // Use browser fetch (page.evaluate) to include cookies; provide header x-csrf-token
  const uniqueTitle = `E2E Draft ${Date.now()}`;
  const createWithCsrf = await page.evaluate(async (title, token) => {
    const res = await fetch('/api/v1/nimbus/ai/drafts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': token,
      },
      body: JSON.stringify({ title, dryRun: true }),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }, uniqueTitle, csrfValue || csrfFromBody);

  expect([200, 201, 202]).toContain(createWithCsrf.status);

  // Now attempt invite endpoint (protected) without header -> should 403
  const uniqueEmail = `e2e+csfr-${Date.now()}@example.com`;
  const inviteNoHeader = await page.evaluate(async (email) => {
    const res = await fetch('/api/admin/users/admins/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, uniqueEmail);

  expect(inviteNoHeader.status).toBe(403);
  expect(inviteNoHeader.body && inviteNoHeader.body.error).toBe('CSRF_MISMATCH');

  // Retry invite with header set -> should succeed (or return 200/201)
  const inviteWithHeader = await page.evaluate(async (email, token) => {
    const res = await fetch('/api/admin/users/admins/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, uniqueEmail, csrfValue || csrfFromBody);

  expect([200, 201]).toContain(inviteWithHeader.status);
});

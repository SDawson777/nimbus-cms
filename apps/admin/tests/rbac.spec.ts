import { test, expect } from '@playwright/test';

async function loginViaBrowserFetch(page: any, email: string, password: string) {
  if (page.url() === 'about:blank') {
    await page.goto('/healthz', { waitUntil: 'domcontentloaded' });
  }

  const result = await page.evaluate(async (creds) => {
    const url = new URL('/admin/login', window.location.origin).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(creds),
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    return { ok: res.ok, status: res.status, body };
  }, { email, password });

  expect(result.ok).toBeTruthy();
  return result;
}

test('RBAC: owner vs editor access', async ({ page }) => {
  const ownerEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const ownerPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  const editorEmail = process.env.E2E_ADMIN_SECONDARY_EMAIL || 'e2e-editor@example.com';
  const editorPassword = process.env.E2E_ADMIN_SECONDARY_PASSWORD || (editorEmail.split('@')[0] + '-pass');

  // Owner login via browser fetch so auth cookies are set.
  await loginViaBrowserFetch(page, ownerEmail, ownerPassword);

  // Owner should be able to list admins via API
  const ownerListResp = await page.request.get('/api/admin/users');
  expect(ownerListResp.status()).toBe(200);

  await page.goto('/admins');
  await page.waitForSelector('h2', { timeout: 10000 });
  await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible({ timeout: 5000 });

  // Logout (server clears cookies)
  await page.evaluate(async () => {
    await fetch(new URL('/admin/logout', window.location.origin).toString(), { method: 'GET' });
  });
  await page.goto('/login');

  // Editor: log in via browser fetch, then attempt /admins
  await loginViaBrowserFetch(page, editorEmail, editorPassword);

  // Editor should be forbidden from listing admins via API
  const editorListResp = await page.request.get('/api/admin/users');
  expect(editorListResp.status()).toBe(403);

  // This may redirect to /login; Playwright can report that as an interrupted navigation.
  await page.goto('/admins').catch(() => {});
  // UI should show a permission warning/toast when editor visits /admins.
  await page.goto('/admins').catch(() => {});
  await expect(page.locator('text=Permission required')).toBeVisible({ timeout: 5000 });
});

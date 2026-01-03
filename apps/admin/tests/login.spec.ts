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

test('admin login API works and dashboard is reachable', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  // Log in via a browser fetch so cookies are attached to the page.
  await loginViaBrowserFetch(page, email, password);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
});

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

async function readCsrfToken(page: any) {
  const cookies = await page.context().cookies();
  const csrfCookieObj = cookies.find((c: any) => c.name === 'admin_csrf' || c.name.toLowerCase().includes('csrf')) || null;
  return csrfCookieObj ? csrfCookieObj.value : null;
}

test('compliance snapshot: unauthenticated is blocked; editor is forbidden (RBAC)', async ({ page }) => {
  // 1) Unauthenticated should be blocked by requireAdmin.
  const unauth = await page.request.post('/api/admin/compliance/snapshot', { data: {} });
  expect(unauth.status()).toBe(401);

  // 2) Editor/admin-without-ORG_ADMIN should be forbidden even with valid CSRF.
  const editorEmail = process.env.E2E_ADMIN_SECONDARY_EMAIL || 'e2e-editor@example.com';
  const editorPassword = process.env.E2E_ADMIN_SECONDARY_PASSWORD || (editorEmail.split('@')[0] + '-pass');

  await loginAsAdmin(page, editorEmail, editorPassword);
  const csrf = await readCsrfToken(page);
  expect(csrf).toBeTruthy();

  const result = await page.evaluate(async ({ token }) => {
    const url = new URL('/api/admin/compliance/snapshot', window.location.origin).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': token,
      },
      body: JSON.stringify({}),
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    return { status: res.status, body };
  }, { token: csrf });

  expect(result.status).toBe(403);
});

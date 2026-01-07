import { expect, type Page } from '@playwright/test';

type LoginCredentials = { email: string; password: string };

export async function loginAsAdmin(
  page: Page,
  emailOrCreds: string | LoginCredentials,
  passwordMaybe?: string,
) {
  const email = typeof emailOrCreds === 'string' ? emailOrCreds : emailOrCreds.email;
  const password = typeof emailOrCreds === 'string' ? passwordMaybe : emailOrCreds.password;

  expect(typeof email).toBe('string');
  expect(typeof password).toBe('string');

  // Ensure a real origin exists for subsequent navigations.
  if (page.url() === 'about:blank') {
    await page.goto('/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
  }

  const response = await page.request.post('/admin/login', {
    data: { email, password },
  });

  const ok = response.ok();
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // ignore
  }

  expect(ok, `Login failed: ${response.status()} ${JSON.stringify(body)}`).toBeTruthy();

  // Let Playwright parse/track cookies from the response in its request context,
  // then copy them into the browser context so SPA navigation is authenticated.
  const state = await page.request.storageState();
  if (process.env.E2E_DEBUG_COOKIES === '1') {
    // eslint-disable-next-line no-console
    console.log('loginAsAdmin.storageState.cookies', state.cookies);
  }
  if (state.cookies?.length) {
    await page.context().addCookies(state.cookies);
  }

  // Confirm the browser context is authenticated (cookies actually sent).
  // This catches cases where cookies were added but are not eligible to be used.
  await page.goto('/healthz', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const meCheck = await page.evaluate(async () => {
    const res = await fetch('/admin/me', { credentials: 'include' });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    return { ok: res.ok, status: res.status, body };
  });

  expect(
    meCheck.ok,
    `Browser auth check failed: ${meCheck.status} ${JSON.stringify(meCheck.body)}`,
  ).toBeTruthy();

  return { ok: true, status: response.status(), body };
}

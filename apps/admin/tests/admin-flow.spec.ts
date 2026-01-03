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

test('admin flows: login, admin-user CRUD, navigation', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  // Log in via a browser fetch so cookies are attached to this page context.
  await loginViaBrowserFetch(page, adminEmail, adminPassword);

  // Land on dashboard in an authenticated SPA context.
  await page.goto('/dashboard');
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 30000 }).catch(() => {});
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60000 });

  // Admins page: invite, edit role, delete
  await page.goto('/admins');
  // Wait for admins header to appear
  await page.waitForSelector('h2', { timeout: 10000 });
  await expect(page.locator('h2', { hasText: 'Admin Users' })).toBeVisible({ timeout: 5000 });

  const unique = `e2e+${Date.now()}@example.com`;
  const inviteInput = page.locator('form input[placeholder="user@example.com"]');
  await inviteInput.waitFor({ timeout: 10000 });
  await inviteInput.fill(unique);
  await page.getByRole('button', { name: 'Invite' }).click();

  // Wait for success message or row to appear
  await expect(page.locator('text=Invitation sent').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  await expect(page.locator(`text=${unique}`)).toBeVisible({ timeout: 5000 });

  // Edit role via prompt
  page.once('dialog', async (dialog) => {
    await dialog.accept('ORG_ADMIN');
  });
  const editBtn = page.getByRole('button', { name: `Edit ${unique}` }).first();
  await editBtn.click();
  // After update, role text should appear in the row
  await expect(page.locator(`tr:has-text("${unique}") >> text=ORG_ADMIN`)).toBeVisible({ timeout: 5000 });

  // Delete: accept confirm dialog
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  const deleteBtn = page.getByRole('button', { name: `Delete ${unique}` }).first();
  await deleteBtn.click();
  await expect(page.locator(`text=${unique}`)).toHaveCount(0, { timeout: 5000 });

  // Navigation smoke tests: personalization, analytics, settings
  await page.goto('/personalization');
  await expect(page.locator('h1', { hasText: 'Personalization Rules' })).toBeVisible({ timeout: 5000 });

  await page.goto('/analytics');
  await expect(page.locator('h1', { hasText: 'Analytics' })).toBeVisible({ timeout: 5000 });

  await page.goto('/settings');
  await expect(page.locator('h1', { hasText: 'Admin Settings' })).toBeVisible({ timeout: 5000 });
});

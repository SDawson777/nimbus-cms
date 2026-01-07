import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test('orders: list loads and drawer opens when available', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'e2e-password';

  await loginAsAdmin(page, adminEmail, adminPassword);

  const apiResp = await page.request.get('/api/admin/orders');
  expect(apiResp.status()).toBe(200);
  const apiJson = await apiResp.json();
  expect(apiJson).toHaveProperty('orders');
  expect(Array.isArray(apiJson.orders)).toBeTruthy();

  await page.goto('/orders');
  await expect(page.locator('h2', { hasText: 'Orders' })).toBeVisible({ timeout: 30_000 });

  // If there are orders, ensure we can open the drawer.
  if (Array.isArray(apiJson.orders) && apiJson.orders.length > 0) {
    await page.getByRole('button', { name: /^Open order / }).first().click();
    await expect(page.getByRole('dialog', { name: 'Order details' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Order ID')).toBeVisible({ timeout: 10_000 });
  } else {
    await expect(page.locator('text=No orders found for the selected filters.')).toBeVisible({ timeout: 10_000 });
  }
});

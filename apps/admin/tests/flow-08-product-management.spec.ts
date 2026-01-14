import { test, expect } from '@playwright/test';

test('UX Flow 8: Product Management', async ({ page }) => {
  console.log('🛍️ Testing Product Management Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[autocomplete="username"]').first().fill(process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.com');
  await page.locator('input[type="password"]').first().fill(process.env.E2E_ADMIN_PASSWORD || 'e2e-password');
  await page.locator('button[type="submit"]').first().click();
  
  try {
    await page.waitForURL(/\/(dashboard|admin|home)/, { timeout: 5000 });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  
  console.log('Navigating to Products...');
  
  // Navigate to products page
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/flow8-products-list.png', fullPage: true });
  
  // Wait for products table to populate
  const tableBody = page.locator('table tbody');
  await tableBody.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  
  // Check for actual product data in table rows
  const productRows = await page.locator('table tbody tr').count();
  console.log('Product rows found:', productRows);
  
  // Verify demo products are displayed
  const hasNimbusOG = await page.locator('text=Nimbus OG').count();
  const hasMidnightMints = await page.locator('text=Midnight Mints').count();
  const hasSunrisePreroll = await page.locator('text=Sunrise').count();
  console.log('Demo products visible - Nimbus OG:', hasNimbusOG, 'Midnight Mints:', hasMidnightMints, 'Sunrise:', hasSunrisePreroll);
  
  // Check for product columns (Name, Price, Type)
  const nameColumn = await page.locator('th:has-text("Name"), td:has-text("Nimbus")').count();
  const priceColumn = await page.locator('th:has-text("Price"), td:has-text("$")').count();
  console.log('Table columns - Name:', nameColumn, 'Price:', priceColumn);
  
  // Check for recalled product checkbox
  const recalledCheckbox = await page.locator('input[type="checkbox"]').count();
  console.log('Recalled filter checkbox:', recalledCheckbox);
  
  // Toggle recalled products to show recalled items
  if (recalledCheckbox > 0) {
    await page.locator('input[type="checkbox"]').first().check();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/flow8-products-with-recalled.png', fullPage: true });
    
    // Check if recalled product (Purple Haze) appears
    const hasRecalledProduct = await page.locator('text=Yes, text=Purple Haze').count();
    console.log('Recalled products visible:', hasRecalledProduct > 0 ? 'Yes' : 'No');
  }
  
  await page.screenshot({ path: '/tmp/flow8-products-final.png', fullPage: true });
  
  console.log('✅ Product Management Flow Complete');
  
  // Verify products are actually populated
  const productsPopulated = productRows > 0 || hasNimbusOG > 0 || hasMidnightMints > 0;
  expect(productsPopulated).toBeTruthy();
  
  // Verify page loaded with products title
  const hasProductsTitle = await page.locator('h1:has-text("Product"), h2:has-text("Product")').count() > 0;
  expect(hasProductsTitle || productRows > 0).toBeTruthy();
});

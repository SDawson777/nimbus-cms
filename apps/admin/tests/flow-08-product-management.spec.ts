import { test, expect } from '@playwright/test';

test('UX Flow 8: Product Management', async ({ page }) => {
  console.log('🛍️ Testing Product Management Flow...');
  
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[autocomplete="username"]').first().fill('demo@nimbus.app');
  await page.locator('input[type="password"]').first().fill('Nimbus!Demo123');
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
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow8-products-list.png', fullPage: true });
  
  // Check for product list
  const productRows = await page.locator('table tr, .product-card, [class*="product"]').count();
  console.log('Product items found:', productRows);
  
  // Check for "Add Product" or "Create" button
  const addButton = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add")').count();
  console.log('Add product buttons:', addButton);
  
  // Try clicking add product button
  const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add")').first();
  if (await createButton.count() > 0) {
    console.log('Opening create product form...');
    await createButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow8-product-create-form.png', fullPage: true });
    
    // Check for form fields
    const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i], input[label*="name" i]').count();
    const priceInput = await page.locator('input[name="price"], input[type="number"], input[placeholder*="price" i]').count();
    console.log('Form fields - Name:', nameInput, 'Price:', priceInput);
  }
  
  // Try clicking first product to view/edit
  const firstProduct = page.locator('table tr:not(:first-child), .product-card, [class*="product"]').first();
  if (await firstProduct.count() > 0) {
    console.log('Opening product details...');
    await firstProduct.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow8-product-details.png', fullPage: true });
  }
  
  // Check for search/filter
  const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i]').count();
  console.log('Search input found:', searchInput);
  
  await page.screenshot({ path: '/tmp/flow8-products-final.png', fullPage: true });
  
  console.log('✅ Product Management Flow Complete');
  
  // Verify products page loaded
  const hasProductContent = productRows > 0 || addButton > 0 ||
                           await page.locator('h1:has-text("Product"), h2:has-text("Product")').count() > 0;
  expect(hasProductContent).toBeTruthy();
});

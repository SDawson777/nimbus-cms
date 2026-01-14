import { test, expect } from '@playwright/test';

test('UX Flow 9: Content Management (CMS)', async ({ page }) => {
  console.log('📝 Testing Content CMS Flow...');
  
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
  
  console.log('Navigating to Articles (Content)...');
  
  // Navigate to articles page - the main content management page
  await page.goto('/articles');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow9-content-list.png', fullPage: true });
  
  // Check for content items
  const contentItems = await page.locator('table tr, .content-card, article, [class*="content"]').count();
  console.log('Content items found:', contentItems);
  
  // Check for "Create" or "Add" button
  const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a:has-text("Create")').count();
  console.log('Create content buttons:', createButton);
  
  // Try clicking create content
  const addContentButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a:has-text("Create")').first();
  if (await addContentButton.count() > 0) {
    console.log('Opening content editor...');
    await addContentButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/flow9-content-editor.png', fullPage: true });
    
    // Check for editor elements
    const titleInput = await page.locator('input[name="title"], input[placeholder*="title" i]').count();
    const editor = await page.locator('textarea, [contenteditable="true"], .editor, [class*="editor"]').count();
    console.log('Editor elements - Title:', titleInput, 'Editor:', editor);
  }
  
  // Try clicking first content item
  const firstContent = page.locator('table tr:not(:first-child), .content-card, article').first();
  if (await firstContent.count() > 0 && await createButton.count() === 0) {
    console.log('Opening content item...');
    await firstContent.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow9-content-details.png', fullPage: true });
  }
  
  // Check for filters (published/draft/archived)
  const statusFilters = await page.locator('button:has-text("Published"), button:has-text("Draft"), select').count();
  console.log('Status filters found:', statusFilters);
  
  await page.screenshot({ path: '/tmp/flow9-content-final.png', fullPage: true });
  
  console.log('✅ Content CMS Flow Complete');
  
  // Verify content page loaded
  const hasContentPage = contentItems > 0 || createButton > 0 ||
                        await page.locator('h1:has-text("Content"), h2:has-text("Content")').count() > 0;
  expect(hasContentPage).toBeTruthy();
});

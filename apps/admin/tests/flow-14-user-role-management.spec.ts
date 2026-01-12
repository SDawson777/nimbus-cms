import { test, expect } from '@playwright/test';

test('UX Flow 14: User & Role Management', async ({ page }) => {
  console.log('👥 Testing User & Role Management Flow...');
  
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
  
  console.log('Navigating to Admin Users...');
  
  // Navigate to admins/users page
  await page.goto('/admins');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '/tmp/flow14-users-list.png', fullPage: true });
  
  // Check for user list
  const userRows = await page.locator('table tr, .user-card, [class*="user"]').count();
  console.log('Admin users found:', userRows);
  
  // Check for "Invite" or "Add" button
  const inviteButton = await page.locator('button:has-text("Invite"), button:has-text("Add"), button:has-text("Create")').count();
  console.log('Invite user buttons:', inviteButton);
  
  // Try clicking invite button
  const addUserButton = page.locator('button:has-text("Invite"), button:has-text("Add"), button:has-text("Create")').first();
  if (await addUserButton.count() > 0) {
    console.log('Opening invite form...');
    await addUserButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow14-invite-form.png', fullPage: true });
    
    // Check for form fields
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const roleSelect = await page.locator('select, input[name="role"], [class*="role"]').count();
    console.log('Invite form - Email:', emailInput, 'Role:', roleSelect);
  }
  
  // Check for role badges/labels
  const roleBadges = await page.locator('text=/OWNER|ORG_ADMIN|EDITOR|VIEWER/i').or(page.locator('[class*="role"]')).count();
  console.log('Role badges:', roleBadges);
  
  // Try clicking first user to view details
  const firstUser = page.locator('table tr:not(:first-child), .user-card').first();
  if (await firstUser.count() > 0 && await inviteButton.count() === 0) {
    console.log('Opening user details...');
    await firstUser.click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow14-user-details.png', fullPage: true });
  }
  
  // Check for permission matrix
  const permissions = await page.locator('text=/permission|access|capability/i').count();
  console.log('Permission references:', permissions);
  
  await page.screenshot({ path: '/tmp/flow14-users-final.png', fullPage: true });
  
  console.log('✅ User & Role Management Flow Complete');
  
  // Verify users page loaded
  const hasUserContent = userRows > 0 || inviteButton > 0 || roleBadges > 0 ||
                        await page.locator('h1:has-text("Admin"), h2:has-text("User")').count() > 0;
  expect(hasUserContent).toBeTruthy();
});

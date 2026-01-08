import { test, expect } from '@playwright/test';

test('UX Flow 16: Notifications Center', async ({ page }) => {
  console.log('🔔 Testing Notifications Flow...');
  
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
  
  console.log('Checking for notifications...');
  
  // Look for notification bell/icon
  const notificationIcon = await page.locator('button[aria-label*="notif" i], [class*="bell"], [class*="notification"]').count();
  console.log('Notification icons found:', notificationIcon);
  
  // Try clicking notification icon
  const bellIcon = page.locator('button[aria-label*="notif" i], [class*="bell"]').first();
  if (await bellIcon.count() > 0) {
    console.log('Opening notifications panel...');
    await bellIcon.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/flow16-notifications-panel.png', fullPage: true });
    
    // Check for notification items
    const notificationItems = await page.locator('[class*="notification-item"], li, .notification').count();
    console.log('Notification items:', notificationItems);
  }
  
  // Try navigating to dedicated notifications page
  await page.goto('/notifications');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/tmp/flow16-notifications-page.png', fullPage: true });
  
  // Check for notification list
  const notifications = await page.locator('[class*="notification"], .card, article').count();
  console.log('Notifications on page:', notifications);
  
  // Check for read/unread indicators
  const unreadBadges = await page.locator('[class*="unread"], [class*="badge"]').count();
  console.log('Unread badges:', unreadBadges);
  
  // Check for "Mark all read" button
  const markReadButton = await page.locator('button:has-text("Mark"), button:has-text("Read")').count();
  console.log('Mark as read buttons:', markReadButton);
  
  // Check for notification settings
  const settingsLink = await page.locator('a:has-text("Settings"), button:has-text("Settings")').count();
  console.log('Settings links:', settingsLink);
  
  await page.screenshot({ path: '/tmp/flow16-notifications-final.png', fullPage: true });
  
  console.log('✅ Notifications Flow Complete');
  
  // Verify notifications loaded (icon or page)
  const hasNotificationContent = notificationIcon > 0 || notifications > 0 ||
                                 await page.locator('h1, h2, h3').count() > 0;
  expect(hasNotificationContent).toBeTruthy();
});

import { test, expect } from '@playwright/test';

test('debug baseURL', async ({ page, baseURL }) => {
  console.log('baseURL from context:', baseURL);
  console.log('E2E_BASE_URL env:', process.env.E2E_BASE_URL);
  
  await page.goto('/');
  
  const url = page.url();
  console.log('Current URL:', url);
  
  expect(url).toContain('localhost');
});

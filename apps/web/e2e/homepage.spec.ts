import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Azeebo\+/);
  });

  test('should have skip link for accessibility', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveTitle(/Azeebo\+/);
  });
});

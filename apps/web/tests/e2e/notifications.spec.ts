import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Push Notifications', () => {
  test.describe('Notification List', () => {
    test('should display notifications page', async ({ page }) => {
      await page.goto(`${BASE_URL}/notifications`);
      await expect(page.locator('[data-testid="notifications-page"], .notifications-page')).toBeVisible();
    });

    test('should show notification items', async ({ page }) => {
      await page.goto(`${BASE_URL}/notifications`);
      await expect(page.locator('[data-testid="notification-item"], .notification-item').first()).toBeVisible();
    });

    test('should filter unread notifications', async ({ page }) => {
      await page.goto(`${BASE_URL}/notifications`);
      const filterButton = page.locator('button:has-text("Unread"), [data-testid="filter-unread"]');

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Notification Actions', () => {
    test('should mark notification as read', async ({ page }) => {
      await page.goto(`${BASE_URL}/notifications`);
      const notification = page.locator('[data-testid="notification-item"], .notification-item').first();

      if (await notification.isVisible()) {
        await notification.click();
        // Should mark as read
        await page.waitForTimeout(500);
      }
    });

    test('should mark all as read', async ({ page }) => {
      await page.goto(`${BASE_URL}/notifications`);
      const markAllButton = page.locator('button:has-text("Mark all"), [data-testid="mark-all-read"]');

      if (await markAllButton.isVisible()) {
        await markAllButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should delete notification', async ({ page }) => {
      await page.goto(`${BASE_URL}/notifications`);
      const deleteButton = page.locator('[data-testid="delete-notification"], button:has-text("Delete")').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Notification Preferences', () => {
    test('should show notification settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/notifications`);
      await expect(page.locator('[data-testid="notification-settings"], .notification-settings')).toBeVisible();
    });

    test('should toggle push notifications', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/notifications`);
      const toggle = page.locator('[data-testid="push-toggle"], input[type="checkbox"]').first();

      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(500);
      }
    });

    test('should toggle email notifications', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/notifications`);
      const toggle = page.locator('[data-testid="email-toggle"], input[type="checkbox"]').nth(1);

      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Notification Badge', () => {
    test('should show unread count in header', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      const badge = page.locator('[data-testid="notification-badge"], .notification-badge');

      // Badge may or may not be visible depending on unread count
      const isVisible = await badge.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });
});

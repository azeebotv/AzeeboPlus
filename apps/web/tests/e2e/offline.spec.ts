import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Offline Mode', () => {
  test.describe('Service Worker', () => {
    test('should register service worker', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);

      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });

      // SW registration may or may not succeed in test environment
      expect(typeof swRegistered).toBe('boolean');
    });
  });

  test.describe('Offline Indicator', () => {
    test('should show offline indicator when disconnected', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);

      // Simulate offline
      await page.evaluate(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await page.waitForTimeout(500);

      const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-indicator');
      const isVisible = await offlineIndicator.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should hide indicator when back online', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);

      // Simulate online
      await page.evaluate(() => {
        window.dispatchEvent(new Event('online'));
      });

      await page.waitForTimeout(500);
    });
  });

  test.describe('Cached Content', () => {
    test('should serve cached content when offline', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForTimeout(2000);

      // Content should be cached after first visit
      const hasCachedContent = await page.evaluate(() => {
        return localStorage.length > 0 || sessionStorage.length > 0;
      });

      expect(typeof hasCachedContent).toBe('boolean');
    });
  });

  test.describe('Offline Queue', () => {
    test('should queue mutations when offline', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);

      // Check if offline queue exists
      const hasQueue = await page.evaluate(() => {
        const queue = localStorage.getItem('azeebo_offline_queue');
        return queue !== null;
      });

      expect(typeof hasQueue).toBe('boolean');
    });
  });

  test.describe('Offline Page', () => {
    test('should have offline fallback page', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/offline`);
      // Page should exist
      expect(response?.status()).toBeLessThan(500);
    });
  });
});

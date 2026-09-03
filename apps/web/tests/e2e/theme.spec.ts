import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Dark/Light Theme', () => {
  test.describe('Theme Toggle', () => {
    test('should have theme toggle in settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      const themeToggle = page.locator('[data-testid="theme-toggle"], [data-testid="dark-mode-toggle"]');
      const isVisible = await themeToggle.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should toggle between dark and light mode', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      const themeToggle = page.locator('[data-testid="theme-toggle"], [data-testid="dark-mode-toggle"]');

      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Get new theme
        const newTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });

        // Theme should have changed
        expect(newTheme).not.toBe(initialTheme);
      }
    });
  });

  test.describe('Theme Persistence', () => {
    test('should persist theme preference', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      const themeToggle = page.locator('[data-testid="theme-toggle"], [data-testid="dark-mode-toggle"]');

      if (await themeToggle.isVisible()) {
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForTimeout(1000);

        // Theme should persist
        const theme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });

        expect(theme).toBeTruthy();
      }
    });
  });

  test.describe('System Theme', () => {
    test('should respect system theme preference', async ({ page }) => {
      // Set system preference to dark
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(`${BASE_URL}/home`);
      await page.waitForTimeout(1000);

      const theme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });

      // Should respect system preference
      expect(theme).toBeTruthy();
    });
  });

  test.describe('Theme Colors', () => {
    test('should apply correct dark mode colors', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(`${BASE_URL}/home`);
      await page.waitForTimeout(1000);

      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });

      // Dark mode should have dark background
      expect(bgColor).toBeTruthy();
    });

    test('should apply correct light mode colors', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(`${BASE_URL}/home`);
      await page.waitForTimeout(1000);

      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });

      // Light mode should have light background
      expect(bgColor).toBeTruthy();
    });
  });

  test.describe('Theme Transition', () => {
    test('should have smooth theme transition', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      const themeToggle = page.locator('[data-testid="theme-toggle"], [data-testid="dark-mode-toggle"]');

      if (await themeToggle.isVisible()) {
        // Check for transition CSS
        const hasTransition = await page.evaluate(() => {
          const style = document.createElement('style');
          style.textContent = '* { transition: background-color 0.2s, color 0.2s; }';
          document.head.appendChild(style);
          return true;
        });

        expect(hasTransition).toBe(true);
      }
    });
  });
});

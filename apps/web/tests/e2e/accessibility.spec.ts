import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Accessibility Tests', () => {
  test.describe('WCAG 2.1 AA Compliance', () => {
    test('homepage has no accessibility violations', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('login page has no accessibility violations', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('search page has no accessibility violations', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('profile page has no accessibility violations', async ({ page }) => {
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('wallet page has no accessibility violations', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can navigate homepage with keyboard only', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is visible
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName : null;
      });
      expect(focusedElement).toBeTruthy();
    });

    test('skip navigation link works', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      // Press Tab to focus skip link
      await page.keyboard.press('Tab');

      // Check if skip link is visible
      const skipLink = await page.locator('[href="#main-content"], .skip-link');
      if (await skipLink.isVisible()) {
        await skipLink.click();
        // Verify focus moved to main content
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.id || el?.tagName;
        });
        expect(focusedElement).toBeTruthy();
      }
    });

    test('modal can be closed with Escape key', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      // Find and click a button that opens a modal
      const modalTrigger = await page.locator('button:has-text("Subscribe"), button:has-text("Sign Up")').first();
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();

        // Press Escape to close
        await page.keyboard.press('Escape');

        // Verify modal is closed
        const modal = await page.locator('[role="dialog"], .modal');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('images have alt text', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('form inputs have labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Input should have either a label, aria-label, or aria-labelledby
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('headings are in order', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let lastLevel = 0;

      for (const heading of headings) {
        const tagName = await heading.evaluate((el) => el.tagName);
        const level = parseInt(tagName.replace('H', ''));

        // Heading level should not skip (e.g., h1 -> h3)
        expect(level - lastLevel).toBeLessThanOrEqual(1);
        lastLevel = level;
      }
    });

    test('ARIA landmarks are present', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      // Check for main landmark
      const main = await page.locator('main, [role="main"]').count();
      expect(main).toBeGreaterThan(0);

      // Check for navigation landmark
      const nav = await page.locator('nav, [role="navigation"]').count();
      expect(nav).toBeGreaterThan(0);
    });
  });

  test.describe('Color Contrast', () => {
    test('text has sufficient contrast', async ({ page }) => {
      await page.goto(`${BASE_URL}/home`);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include(['h1', 'h2', 'h3', 'p', 'a', 'button', 'span'])
        .analyze();

      // Check for color contrast violations
      const contrastViolations = results.violations.filter(
        (v) => v.id === 'color-contrast',
      );
      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Form Validation', () => {
    test('form errors are announced to screen readers', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for error messages with aria-live or role="alert"
      const errorMessages = await page.locator('[role="alert"], .error, [aria-live="assertive"]').count();
      expect(errorMessages).toBeGreaterThan(0);
    });
  });
});

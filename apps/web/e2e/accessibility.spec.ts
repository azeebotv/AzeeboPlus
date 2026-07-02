import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Web Accessibility Tests', () => {
  test('login page should be accessible', async ({ page }) => {
    await page.goto('/auth/login');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('home page should be accessible', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('content page should be accessible', async ({ page }) => {
    await page.goto('/browse');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('focus states should be visible', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    const isFocused = await emailInput.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/auth/login');

    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('INPUT');

    await page.keyboard.press('Tab');
    const nextFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(nextFocusedElement).toBe('INPUT');

    await page.keyboard.press('Tab');
    const buttonFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(buttonFocused).toBe('BUTTON');
  });

  test('form labels should be properly associated', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    const labelText = await emailInput.evaluate((el) => {
      const id = el.getAttribute('id');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      return label?.textContent;
    });

    expect(labelText).toBeTruthy();
  });

  test('contrast ratio should meet AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.tags.includes('color-contrast')
    );

    expect(contrastViolations).toEqual([]);
  });
});

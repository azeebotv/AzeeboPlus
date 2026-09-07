import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function formatViolations(
  violations: Array<{
    impact: string;
    id: string;
    description: string;
    nodes: Array<{ target: string[] }>;
  }>
): string {
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.description}\n  Elements: ${v.nodes.map((n) => n.target.join(', ')).join(', ')}`
    )
    .join('\n\n');
}

test.describe('Web Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.addInitScript(() => {
      localStorage.setItem(
        'azeebo_cookie_consent',
        JSON.stringify({
          necessary: true,
          analytics: true,
          marketing: true,
          timestamp: new Date().toISOString(),
          version: '1.0',
        })
      );
      if (typeof navigator !== 'undefined') {
        try {
          navigator.sendBeacon = () => true;
        } catch {}
      }
    });

    await page.route(/\/feature-flags\/bootstrap/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            flags: [
              { key: 'web_recommendations_rail', enabled: true },
              { key: 'web_new_home', enabled: true },
            ],
            generatedAt: new Date().toISOString(),
            evaluatedFor: 'user',
          },
        }),
      });
    });

    await page.route(/\/api\/v1\/public\//, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route(/\/api\/v1\/content/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route(/\/api\/v1\/analytics/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(
      accessibilityScanResults.violations,
      formatViolations(accessibilityScanResults.violations)
    ).toEqual([]);
  });

  test('home page should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      accessibilityScanResults.violations,
      formatViolations(accessibilityScanResults.violations)
    ).toEqual([]);
  });

  test('movies page should be accessible', async ({ page }) => {
    await page.goto('/movies');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      accessibilityScanResults.violations,
      formatViolations(accessibilityScanResults.violations)
    ).toEqual([]);
  });

  test('reality page should be accessible', async ({ page }) => {
    await page.goto('/reality');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    expect(
      accessibilityScanResults.violations,
      formatViolations(accessibilityScanResults.violations)
    ).toEqual([]);
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

    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('INPUT');

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

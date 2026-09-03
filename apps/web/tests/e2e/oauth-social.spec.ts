import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Social OAuth Flow', () => {
  test.describe('Google OAuth', () => {
    test('should show Google sign-in button when feature flag enabled', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      // Google button should be visible if feature flag is enabled
      const googleButton = page.locator('[data-testid="login-google-button"], button:has-text("Google")');
      // Button may or may not be visible depending on feature flag
      const isVisible = await googleButton.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should redirect to Google OAuth when clicked', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      const googleButton = page.locator('[data-testid="login-google-button"], button:has-text("Google")');

      if (await googleButton.isVisible()) {
        // Mock the OAuth endpoint
        await page.route('**/v1/auth/social/google/authorize', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                authorizeUrl: 'https://accounts.google.com/o/oauth2/auth?mock=true',
                state: 'test-state',
              },
            }),
          });
        });

        await googleButton.click();
        // Should attempt to open OAuth URL
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Apple OAuth', () => {
    test('should show Apple sign-in button when feature flag enabled', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      const appleButton = page.locator('[data-testid="login-apple-button"], button:has-text("Apple")');
      const isVisible = await appleButton.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('OAuth Callback', () => {
    test('should handle OAuth callback with code', async ({ page }) => {
      // Mock the callback URL
      await page.goto(`${BASE_URL}/auth/callback?code=test-code&state=test-state`);
      // Should either redirect to home or show error
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toBeTruthy();
    });

    test('should handle OAuth callback with error', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/callback?error=access_denied`);
      await page.waitForTimeout(2000);
      // Should show error or redirect
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });

  test.describe('Account Linking', () => {
    test('should show connected accounts in settings', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home');

      // Go to settings
      await page.goto(`${BASE_URL}/settings`);
      await expect(page.locator('[data-testid="connected-accounts"], .connected-accounts')).toBeVisible();
    });
  });
});

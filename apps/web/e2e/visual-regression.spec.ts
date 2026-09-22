/**
 * Visual Regression Tests
 *
 * Takes screenshots of key pages and compares them to baseline.
 * Run: npx playwright test e2e/visual-regression.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

/* ── Helpers ────────────────────────────────────────────────────────────────── */

async function simulateAuth(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('azeebo_access_token', 'test-access-token');
    localStorage.setItem('azeebo_refresh_token', 'test-refresh-token');
    localStorage.setItem(
      'azeebo_user',
      JSON.stringify({
        id: 'test-user-1',
        email: 'test@azeeboplus.com',
        name: 'Test User',
        displayName: 'TestUser',
        role: 'user',
      }),
    );
    // Namespaced marker — the bare `auth` cookie name is shared across all
    // localhost apps and must not be used (see src/lib/cookie-names.ts).
    document.cookie = 'azeebo_web_auth=test-user-1; path=/; max-age=604800; SameSite=Lax';
  });
}

/* ── Guest Pages ────────────────────────────────────────────────────────────── */

test.describe('Visual Regression — Guest Pages', () => {
  test('homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('login page screenshot', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('register page screenshot', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('browse page screenshot', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('browse-guest.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

/* ── Authenticated Pages ────────────────────────────────────────────────────── */

test.describe('Visual Regression — Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await simulateAuth(page);
  });

  test('home page screenshot', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-authenticated.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('wallet page screenshot', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('wallet.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('profile page screenshot', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('profile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('settings page screenshot', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('settings.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('search page screenshot', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('search.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('music page screenshot', async ({ page }) => {
    await page.goto('/music');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('music.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('movies page screenshot', async ({ page }) => {
    await page.goto('/movies');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('movies.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('games page screenshot', async ({ page }) => {
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('games.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('rewards page screenshot', async ({ page }) => {
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('rewards.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('notifications page screenshot', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('notifications.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

/* ── Responsive Viewports ───────────────────────────────────────────────────── */

test.describe('Visual Regression — Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await simulateAuth(page);
  });

  test('homepage mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('homepage tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-tablet.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('homepage desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

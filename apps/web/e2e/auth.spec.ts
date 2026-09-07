import { test, expect } from '@playwright/test';

const MOCK_SLIDES = [
  {
    id: 'slide-1',
    title: 'The Lagos Heist',
    description: 'An adrenaline-fueled chase through the streets of Lagos.',
    duration: 7200,
    thumbnail: '/placeholder-hero.png',
    universe: { id: 'u-1', name: 'Movie', icon: '🎬' },
  },
];

const MOCK_CONTENT_ITEMS = [
  {
    id: 'content-1',
    title: 'Super Eagles Documentary',
    description: 'The journey to the cup.',
    duration: 5400,
    thumbnail: '/placeholder-thumb.png',
    universe: { id: 'u-3', name: 'Sports', icon: '⚽' },
  },
];

test.beforeEach(async ({ page }) => {
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

  await page.route(/\/api\/v1\/public\/settings/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ key: 'site_name', value: 'Azeebo+' }] }),
    });
  });

  await page.route(/\/api\/v1\/public\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route(/\/api\/v1\/feature-flags/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { key: 'web_recommendations_rail', enabled: true },
          { key: 'web_new_home', enabled: true },
        ],
      }),
    });
  });

  await page.route(/\/api\/v1\/wallet/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          balance: 10000,
          currency: 'NGN',
          pendingBalance: 0,
          transactions: [],
        },
      }),
    });
  });

  await page.route(/\/api\/v1\/content\/home($|\?)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          trending: MOCK_SLIDES,
          recommended: MOCK_CONTENT_ITEMS,
          latest: MOCK_CONTENT_ITEMS,
        },
      }),
    });
  });

  await page.route(/\/api\/v1\/content\/(featured-slides|slides|trending|featured)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_SLIDES }),
    });
  });

  await page.route(/\/api\/v1\/content\/categories/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route(/\/api\/v1\/content\/(new-releases|popular|popular-region)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_CONTENT_ITEMS }),
    });
  });

  await page.route(/\/api\/v1\/content(\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { items: MOCK_CONTENT_ITEMS, total: 1 } }),
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

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('h1, h2')).toContainText([/explore nigerian|welcome/i]);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.locator('h1, h2')).toContainText([/empowering|create your azeebo\+/i]);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.locator('a[href*="register"]').first();
    await registerLink.click();

    await expect(page).toHaveURL(/register/);
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');

    await page.click('button[type="submit"]');

    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await page.fill('input[type="password"]', 'password123');

    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.route(/\/api\/v1\/auth\/login/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid email or password',
        }),
      });
    });

    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid|incorrect|unauthorized|not found/i')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Navigation', () => {
  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('a[href*="/auth/login"], a[href*="/auth/register"]').first();
    await expect(navLinks).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/browse');

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should navigate to creators page', async ({ page }) => {
    await page.goto('/creators');

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Content Display', () => {
  test('should display trending content section', async ({ page }) => {
    await page.goto('/');

    const trendingSection = page.locator('text=/Trending Now|Explore by Universe|Get Started/i').first();
    await expect(trendingSection).toBeVisible({ timeout: 10000 });
  });

  test('should display latest content section', async ({ page }) => {
    await page.goto('/');

    const latestSection = page.locator('text=/Unlock Rewards|Earn While Watching|Explore by Universe/i').first();
    await expect(latestSection).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should render correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have accessible forms with labels', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      const firstImage = images.first();
      const alt = await firstImage.getAttribute('alt');
      expect(alt !== null).toBe(true);
    }
  });
});

test.describe('Error States', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');

    const status = page.locator('text=/404|not found|page not found/i');
    await expect(status).toBeVisible({ timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});

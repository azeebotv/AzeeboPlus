import { test, expect } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'test-user-1',
  email: 'test@azeeboplus.com',
  name: 'Test User',
  displayName: 'TestUser',
  role: 'user',
};

const MOCK_SLIDES = [
  {
    id: 'slide-1',
    title: 'The Lagos Heist',
    description: 'An adrenaline-fueled chase through the streets of Lagos.',
    duration: 7200,
    thumbnail: '/placeholder-hero.png',
    universe: { id: 'u-1', name: 'Movie', icon: '🎬' },
  },
  {
    id: 'slide-2',
    title: 'Naija Comedy Fest',
    description: 'Top stand-up comedians perform live in Abuja.',
    duration: 3600,
    thumbnail: '/placeholder-hero.png',
    universe: { id: 'u-2', name: 'Comedy', icon: '😂' },
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
  {
    id: 'content-2',
    title: 'BBN All Stars',
    description: 'Highlights from the house.',
    duration: 4800,
    thumbnail: '/placeholder-thumb.png',
    universe: { id: 'u-4', name: 'Reality', icon: '📺' },
  },
];

const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMSIsImVtYWlsIjoidGVzdEBhemVlYm9wbHVzLmNvbSIsInJvbGUiOiJ1c2VyIn0.mock_signature';

/** Pre-set consent and mock backend APIs so page loads reliably without timeouts. */
test.beforeEach(async ({ page, baseURL }) => {
  // Pre-accept cookie consent to avoid modal blocking interactions and stub background tracking
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

  // Mock API routes to prevent networkidle timeouts from ECONNREFUSED proxying
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

  await page.route(/\/api\/v1\/content\/home-feed/, async (route) => {
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

  await page.route(/\/api\/v1\/content\/(featured-slides|slides)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_SLIDES }),
    });
  });

  await page.route(/\/api\/v1\/content\/trending/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_SLIDES }),
    });
  });

  await page.route(/\/api\/v1\/content\/new-releases/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_CONTENT_ITEMS }),
    });
  });

  await page.route(/\/api\/v1\/content\/popular(-region)?/, async (route) => {
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
      body: JSON.stringify({ success: true, data: { items: MOCK_CONTENT_ITEMS, total: 2 } }),
    });
  });

  await page.route(/\/api\/v1\/public\/settings/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ key: 'site_name', value: 'Azeebo+' }] }),
    });
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

  await page.route(/\/api\/v1\/users\/me/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_USER }),
    });
  });

  await page.route(/\/api\/v1\/auth\/refresh/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { access_token: MOCK_JWT, refresh_token: 'test-refresh-token' },
      }),
    });
  });

  await page.route(/\/(api\/v1\/auth|auth)\/login/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          access_token: MOCK_JWT,
          refresh_token: 'test-refresh-token',
          user: MOCK_USER,
        },
      }),
    });
  });

  await page.route(/\/api\/auth\/(set-cookie|cookie|clear-cookie|refresh-cookie)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Set-Cookie': 'azeebo_web_auth=test-user-1; Path=/; SameSite=Strict',
      },
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(/\/api\/v1\/analytics/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
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
});

/** Simulate authentication by setting localStorage + auth cookie before navigation. */
async function simulateAuth(page: import('@playwright/test').Page): Promise<void> {
  await page.context().addCookies([
    {
      name: 'auth',
      value: 'test-user-1',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'access_token',
      value: MOCK_JWT,
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.addInitScript(
    ({ user, token }) => {
      // Only seed localStorage if auth cookie is present
      const cookies = document.cookie ? document.cookie.split(';') : [];
      const hasAuth = cookies.some((c) => {
        const [k, v] = c.trim().split('=');
        // Namespaced marker only — bare `auth` is foreign jar noise
        return k === 'azeebo_web_auth' && Boolean(v);
      });
      if (hasAuth) {
        localStorage.setItem('azeebo_access_token', token);
        localStorage.setItem('azeebo_refresh_token', 'test-refresh-token');
        localStorage.setItem('azeebo_user', JSON.stringify(user));
      }
    },
    { user: MOCK_USER, token: MOCK_JWT }
  );
}

/** Clear all auth state. */
async function clearAuth(page: import('@playwright/test').Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('azeebo_access_token');
      localStorage.removeItem('azeebo_refresh_token');
      localStorage.removeItem('azeebo_user');
      document.cookie = 'azeebo_web_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {}
  }).catch(() => {});
  await page.goto('about:blank');
}

// ─── Guest Homepage (/) ─────────────────────────────────────────────────────

test.describe('Guest Homepage — Legacy (/)', () => {
  test('should load the legacy homepage for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Azeebo\+/);
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show login and register links in navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible();
    await expect(page.locator('a[href="/auth/register"]').first()).toBeVisible();
  });

  test('should display rewards section for guests', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Unlock Rewards|EARN WHILE WATCHING/i').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display explore by universe section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Explore by Universe/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should render correctly on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should render correctly on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should render correctly on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Server-Side Guard: Auth → /home redirect ──────────────────────────────

test.describe('Server-Side Guard — Authenticated user on / redirects to /home', () => {
  test('should redirect authenticated user from / to /home', async ({ page }) => {
    await simulateAuth(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // URL should be /home
    expect(page.url()).toContain('/home');

    // The redesigned homepage should be visible
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Server-Side Guard: Guest → / redirect ─────────────────────────────────

test.describe('Server-Side Guard — Guest user on /home redirects to /', () => {
  test('should redirect guest from /home to / with login prompt', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    // URL should be / (after redirect)
    expect(page.url()).not.toContain('/home');

    // Guest homepage should be visible
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Client-Side Guard: /home redirect with login prompt ───────────────────

test.describe('Client-Side Guard — /home login prompt', () => {
  test('should show login prompt on /home for guest users', async ({ page }) => {
    await page
      .context()
      .addCookies([
        { name: 'azeebo_web_auth', value: 'temp', domain: 'localhost', path: '/' },
      ]);

    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    // Should show sign-in prompt or redirect
    const signInButton = page.locator('text=/Sign In|Login/i').first();
    const getStartedButton = page.getByRole('button', { name: /Get Started/i }).first();

    await expect(signInButton.or(getStartedButton)).toBeVisible({ timeout: 10000 });
  });
});

// ─── Authenticated Homepage (/home) ────────────────────────────────────────

test.describe('Authenticated Homepage — /home', () => {
  test.beforeEach(async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display personalized greeting or hero carousel', async ({ page }) => {
    const welcomeBack = page.locator('text=/Welcome back|Recommended/i').first();
    const heroCarousel = page.locator('[aria-roledescription="carousel"]').first();
    await expect(welcomeBack.or(heroCarousel)).toBeVisible({ timeout: 10000 });
  });

  test('should display recently watched section', async ({ page }) => {
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display trending section', async ({ page }) => {
    await expect(page.locator('text=/Trending Now/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display new releases section', async ({ page }) => {
    await expect(page.locator('text=/New Releases/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display popular in region section', async ({ page }) => {
    await expect(page.locator('text=/Popular in Your Region/i').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display referral CTA section', async ({ page }) => {
    await expect(page.locator('text=/Invite Friends/i').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should be responsive on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Carousel Accessibility ─────────────────────────────────────────────────

test.describe('Authenticated Homepage — Carousel Accessibility', () => {
  test('should have ARIA labels on carousel controls', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const carousel = page.locator('[aria-roledescription="carousel"]');
    if ((await carousel.count()) > 0) {
      await expect(carousel.first()).toHaveAttribute('aria-label', /Featured content/i);
      await expect(page.locator('button[aria-label*="slide" i]').first()).toBeVisible();
    }
  });

  test('should pause carousel on hover', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const carousel = page.locator('[aria-roledescription="carousel"]');
    if ((await carousel.count()) > 0) {
      await carousel.first().hover();
      const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
      if ((await selectedTab.count()) > 0) {
        const firstIndex = await selectedTab.getAttribute('aria-label');
        await page.waitForTimeout(2000);
        const currentIndex = await selectedTab.getAttribute('aria-label');
        expect(currentIndex).toBe(firstIndex);
      }
    }
  });
});

// ─── Content Cards Accessibility ────────────────────────────────────────────

test.describe('Authenticated Homepage — Content Cards', () => {
  test('should have accessible content cards with aria-labels', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const watchLinks = page.locator('a[aria-label*="Watch " i]');
    const count = await watchLinks.count();
    if (count > 0) {
      await expect(watchLinks.first()).toBeVisible();
      const label = await watchLinks.first().getAttribute('aria-label');
      expect(label).toMatch(/^Watch .+/i);
    }
  });
});

// ─── Cross-Browser Compatibility ────────────────────────────────────────────

test.describe('Authenticated Homepage — Cross-Browser', () => {
  test('should work on Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium');
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should work on Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox');
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should work on WebKit (Safari)', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit');
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Login/Logout Transitions ───────────────────────────────────────────────

test.describe('Homepage Transition — Login', () => {
  test('should redirect to /home after successful login', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if ((await emailInput.count()) > 0) {
      await emailInput.fill('test@azeeboplus.com');
      await passwordInput.fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      // Should redirect to /home
      await page.waitForURL('**/home', { timeout: 10000 });
      expect(page.url()).toContain('/home');
    }
  });

  test('should redirect to ?redirect= param after login', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/auth/login?redirect=/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]');
    if ((await emailInput.count()) > 0) {
      await emailInput.fill('test@azeeboplus.com');
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });
});

test.describe('Homepage Transition — Logout', () => {
  test('should transition from authenticated to guest homepage on logout', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });

    await clearAuth(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Recently Watched/i').first()).not.toBeVisible();
  });

  test('should redirect from /home to / after logout', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });

    await clearAuth(page);

    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toContain('/home');
  });
});

// ─── Newly Registered Users ─────────────────────────────────────────────────

test.describe('Homepage Transition — New User Registration', () => {
  test('should show legacy homepage for unregistered visitor', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Direct URL Navigation Guards ───────────────────────────────────────────

test.describe('Direct URL Navigation Guards', () => {
  test('guest navigating to /home should see login prompt or be redirected', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user navigating to / should be redirected to /home', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/home');
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('guest navigating to / should see legacy homepage', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user navigating to /home should see redesigned homepage', async ({
    page,
  }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Performance Checks ────────────────────────────────────────────────────

test.describe('Homepage Performance', () => {
  test('legacy homepage should load within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('redesigned homepage should load within performance budget', async ({ page }) => {
    await simulateAuth(page);

    const start = Date.now();
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
    await expect(page.locator('text=/Recently Watched/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('redirect from / to /home should be fast', async ({ page }) => {
    await simulateAuth(page);

    const start = Date.now();
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });
    const redirectTime = Date.now() - start;

    expect(redirectTime).toBeLessThan(3000);
  });
});

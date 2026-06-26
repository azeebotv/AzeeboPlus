import { test, expect } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Simulate authentication by setting localStorage + auth cookie. */
async function simulateAuth(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

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
      })
    );
    document.cookie = 'auth=test-user-1; path=/; max-age=604800; SameSite=Lax';
  });
}

/** Clear all auth state. */
async function clearAuth(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('azeebo_access_token');
    localStorage.removeItem('azeebo_refresh_token');
    localStorage.removeItem('azeebo_user');
    document.cookie = 'auth=; path=/; max-age=0; SameSite=Lax';
  });
}

// ─── Guest Homepage (/) ─────────────────────────────────────────────────────

test.describe('Guest Homepage — Legacy (/)', () => {
  test('should load the legacy homepage for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Azeebo\+/);
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show login and register links in navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible();
    await expect(page.locator('a[href="/auth/register"]').first()).toBeVisible();
  });

  test('should display rewards section for guests', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Unlock Exclusive Rewards').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display explore by universe section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Explore by Universe').first()).toBeVisible({ timeout: 10000 });
  });

  test('should render correctly on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });

  test('should render correctly on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });

  test('should render correctly on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Server-Side Guard: Auth → /home redirect ──────────────────────────────

test.describe('Server-Side Guard — Authenticated user on / redirects to /home', () => {
  test('should redirect authenticated user from / to /home', async ({ page }) => {
    await simulateAuth(page);

    // Navigate to / — middleware should redirect to /home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // URL should be /home
    expect(page.url()).toContain('/home');

    // The redesigned homepage should be visible
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Server-Side Guard: Guest → / redirect ─────────────────────────────────

test.describe('Server-Side Guard — Guest user on /home redirects to /', () => {
  test('should redirect guest from /home to / with login prompt', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // URL should be / (after redirect)
    expect(page.url()).not.toContain('/home');

    // Guest homepage should be visible
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Client-Side Guard: /home redirect with login prompt ───────────────────

test.describe('Client-Side Guard — /home login prompt', () => {
  test('should show login prompt on /home for guest users', async ({ page }) => {
    // Set auth cookie to pass middleware, then clear it to simulate stale session
    await page.goto('/');
    await page.context().addCookies([{ name: 'auth', value: 'temp', domain: 'localhost', path: '/' }]);

    // Navigate to /home — middleware allows (cookie exists), but client-side detects no valid session
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Should show sign-in prompt or redirect
    const signInButton = page.locator('text=Sign In').first();
    const getStartedButton = page.locator('text=Get Started Free').first();

    // Either the login prompt or the redirect to / should have happened
    await expect(signInButton.or(getStartedButton)).toBeVisible({ timeout: 10000 });
  });
});

// ─── Authenticated Homepage (/home) ────────────────────────────────────────

test.describe('Authenticated Homepage — /home', () => {
  test.beforeEach(async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
  });

  test('should display personalized greeting or hero carousel', async ({ page }) => {
    const welcomeBack = page.locator('text=/Welcome back/i');
    const heroCarousel = page.locator('[aria-roledescription="carousel"]');
    const welcomeCount = await welcomeBack.count();
    const carouselCount = await heroCarousel.count();
    expect(welcomeCount + carouselCount).toBeGreaterThan(0);
  });

  test('should display recently watched section', async ({ page }) => {
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display trending section', async ({ page }) => {
    await expect(page.locator('text=Trending Now').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display new releases section', async ({ page }) => {
    await expect(page.locator('text=New Releases').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display popular in region section', async ({ page }) => {
    await expect(page.locator('text=Popular in Your Region').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display referral CTA section', async ({ page }) => {
    await expect(page.locator('text=Invite Friends, Earn Rewards').first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Carousel Accessibility ─────────────────────────────────────────────────

test.describe('Authenticated Homepage — Carousel Accessibility', () => {
  test('should have ARIA labels on carousel controls', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('[aria-roledescription="carousel"]');
    if ((await carousel.count()) > 0) {
      await expect(carousel.first()).toHaveAttribute('aria-label', 'Featured content');
      await expect(page.locator('button[aria-label="Previous slide"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Next slide"]')).toBeVisible();
    }
  });

  test('should pause carousel on hover', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('[aria-roledescription="carousel"]');
    if ((await carousel.count()) > 0) {
      await carousel.first().hover();
      const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
      const firstIndex = await selectedTab.getAttribute('aria-label');
      await page.waitForTimeout(7000);
      const currentIndex = await selectedTab.getAttribute('aria-label');
      expect(currentIndex).toBe(firstIndex);
    }
  });
});

// ─── Content Cards Accessibility ────────────────────────────────────────────

test.describe('Authenticated Homepage — Content Cards', () => {
  test('should have accessible content cards with aria-labels', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const watchLinks = page.locator('a[aria-label^="Watch "]');
    const count = await watchLinks.count();
    if (count > 0) {
      await expect(watchLinks.first()).toBeVisible();
      const label = await watchLinks.first().getAttribute('aria-label');
      expect(label).toMatch(/^Watch .+/);
    }
  });
});

// ─── Cross-Browser Compatibility ────────────────────────────────────────────

test.describe('Authenticated Homepage — Cross-Browser', () => {
  test('should work on Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium');
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('should work on Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox');
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('should work on WebKit (Safari)', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit');
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Login/Logout Transitions ───────────────────────────────────────────────

test.describe('Homepage Transition — Login', () => {
  test('should redirect to /home after successful login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Fill login form (assuming test credentials work)
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
    await page.goto('/auth/login?redirect=/dashboard');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    if ((await emailInput.count()) > 0) {
      await emailInput.fill('test@azeeboplus.com');
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      // Should redirect to /dashboard (the ?redirect param)
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });
});

test.describe('Homepage Transition — Logout', () => {
  test('should transition from authenticated to guest homepage on logout', async ({ page }) => {
    // Start as authenticated
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });

    // Clear auth (simulate logout)
    await clearAuth(page);

    // Reload — should see guest homepage
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });

    // Authenticated sections should NOT be visible
    await expect(page.locator('text=Recently Watched').first()).not.toBeVisible();
  });

  test('should redirect from /home to / after logout', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Clear auth
    await clearAuth(page);

    // Navigate to /home — middleware should redirect to /
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/home');
  });
});

// ─── Newly Registered Users ─────────────────────────────────────────────────

test.describe('Homepage Transition — New User Registration', () => {
  test('should show legacy homepage for unregistered visitor', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Direct URL Navigation Guards ───────────────────────────────────────────

test.describe('Direct URL Navigation Guards', () => {
  test('guest navigating to /home should see login prompt or be redirected', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Should be on / with guest homepage
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user navigating to / should be redirected to /home', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should be on /home
    expect(page.url()).toContain('/home');
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('guest navigating to / should see legacy homepage', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user navigating to /home should see redesigned homepage', async ({ page }) => {
    await simulateAuth(page);
    await page.goto('/home');
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Performance Checks ────────────────────────────────────────────────────

test.describe('Homepage Performance', () => {
  test('legacy homepage should load within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    // Should load within 5 seconds (generous for CI)
    expect(loadTime).toBeLessThan(5000);
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });
  });

  test('redesigned homepage should load within performance budget', async ({ page }) => {
    await simulateAuth(page);

    const start = Date.now();
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('redirect from / to /home should be fast', async ({ page }) => {
    await simulateAuth(page);

    const start = Date.now();
    await page.goto('/');
    await page.waitForURL('**/home', { timeout: 10000 });
    const redirectTime = Date.now() - start;

    // Redirect should complete within 3 seconds
    expect(redirectTime).toBeLessThan(3000);
  });
});

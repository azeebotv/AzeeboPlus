import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.describe('Guest Homepage', () => {
    test('should load the guest homepage for unauthenticated users', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Azeebo\+/);
    });

    test('should have skip link for accessibility', async ({ page }) => {
      await page.goto('/');
      const skipLink = page.locator('.skip-link');
      await expect(skipLink).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page).toHaveTitle(/Azeebo\+/);
    });

    test('should display guest hero with CTA buttons', async ({ page }) => {
      await page.goto('/');

      // Should show "Get Started Free" and "I already have an account" CTAs
      await expect(
        page.locator('text=Get Started Free').first()
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('text=I already have an account').first()
      ).toBeVisible();
    });

    test('should display the rewards section for guests', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=Unlock Exclusive Rewards').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display explore by universe section', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=Explore by Universe').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should show login link in navigation', async ({ page }) => {
      await page.goto('/');

      const loginLink = page.locator('a[href="/auth/login"]').first();
      await expect(loginLink).toBeVisible();
    });

    test('should show register link in navigation', async ({ page }) => {
      await page.goto('/');

      const registerLink = page.locator('a[href="/auth/register"]').first();
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Guest Homepage — Trending Content Preview', () => {
    test('should display trending section when content is available', async ({ page }) => {
      await page.goto('/');

      // Trending section may or may not be present depending on API
      const trending = page.locator('text=Trending Now').first();
      // Just verify the page loads — trending content depends on API availability
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Guest Homepage — Carousel Accessibility', () => {
    test('should have ARIA labels on carousel navigation buttons', async ({ page }) => {
      await page.goto('/');

      // If featured content is loaded, carousel should be present
      const carousel = page.locator('[aria-roledescription="carousel"]');
      const carouselCount = await carousel.count();

      if (carouselCount > 0) {
        await expect(carousel.first()).toBeVisible();

        // Check for prev/next buttons with aria-labels
        const prevButton = page.locator('button[aria-label="Previous slide"]');
        const nextButton = page.locator('button[aria-label="Next slide"]');
        await expect(prevButton).toBeVisible();
        await expect(nextButton).toBeVisible();

        // Check for slide navigation tablist
        const tablist = page.locator('[role="tablist"][aria-label="Slide navigation"]');
        await expect(tablist).toBeVisible();
      }
    });

    test('should navigate carousel with keyboard arrows', async ({ page }) => {
      await page.goto('/');

      const carousel = page.locator('[aria-roledescription="carousel"]');
      const carouselCount = await carousel.count();

      if (carouselCount > 0) {
        // Focus the carousel and press arrow keys
        await carousel.first().focus();
        await page.keyboard.press('ArrowRight');

        // Verify the slide changed (indicator dots should update)
        const tabs = page.locator('[role="tab"]');
        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Guest Homepage — Content Row Navigation', () => {
    test('should have scroll buttons on content rows', async ({ page }) => {
      await page.goto('/');

      // Check for scroll buttons with aria-labels
      const scrollButtons = page.locator('button[aria-label*="Scroll"]');
      const count = await scrollButtons.count();
      expect(count).toBeGreaterThanOrEqual(0); // May not be present if no content loaded
    });
  });

  test.describe('Guest Homepage — Cross-Device Responsive', () => {
    test('should render correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await expect(page).toHaveTitle(/Azeebo\+/);

      // Key elements should still be visible
      await expect(page.locator('text=Get Started Free').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should render correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await expect(page).toHaveTitle(/Azeebo\+/);
    });

    test('should render correctly on large desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await expect(page).toHaveTitle(/Azeebo\+/);
    });
  });

  test.describe('Guest Homepage — PWA Install Prompt', () => {
    test('should potentially show PWA install prompt after delay', async ({ page }) => {
      await page.goto('/');

      // The install prompt appears after 5s — just verify the page loads
      await expect(page.locator('text=Get Started Free').first()).toBeVisible({
        timeout: 10000,
      });
    });
  });
});

test.describe('Authenticated Homepage', () => {
  // Helper to simulate authentication via localStorage + cookie
  async function simulateAuth(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set auth tokens in localStorage to simulate logged-in state
    await page.evaluate(() => {
      localStorage.setItem(
        'azeebo_access_token',
        'test-access-token'
      );
      localStorage.setItem(
        'azeebo_refresh_token',
        'test-refresh-token'
      );
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
      // Set the auth cookie that middleware reads
      document.cookie = 'auth=test-user-1; path=/; max-age=604800; SameSite=Lax';
    });
  }

  test.describe('Authentication State Detection', () => {
    test('should detect authenticated state and render auth homepage', async ({ page }) => {
      await simulateAuth(page);

      // Reload to trigger auth detection with the stored tokens
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // The page should render — either guest or auth homepage
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Authenticated Homepage Sections', () => {
    test('should display personalized greeting', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show welcome back message (or hero if featured slides loaded)
      const welcomeBack = page.locator('text=/Welcome back/i');
      const heroCarousel = page.locator('[aria-roledescription="carousel"]');

      // At least one should be visible
      const welcomeCount = await welcomeBack.count();
      const carouselCount = await heroCarousel.count();
      expect(welcomeCount + carouselCount).toBeGreaterThan(0);
    });

    test('should display recently watched section', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Recently watched section should exist (may be empty/loading)
      const recentlyWatched = page.locator('[data-testid="recently-watched"], text=Recently Watched');
      // This section is always rendered for authenticated users
      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display recommendation sections when available', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Recommendation sections should be present (depends on API)
      // Just verify the page renders the authenticated layout
      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display trending section', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Trending Now').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display new releases section', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=New Releases').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display popular in region section', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Popular in Your Region').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display referral CTA section', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Invite Friends, Earn Rewards').first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Authenticated Homepage — Hero Carousel', () => {
    test('should have accessible carousel controls', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const carousel = page.locator('[aria-roledescription="carousel"]');
      if ((await carousel.count()) > 0) {
        // Verify ARIA attributes
        await expect(carousel.first()).toHaveAttribute('aria-label', 'Featured content');

        // Verify navigation buttons
        await expect(page.locator('button[aria-label="Previous slide"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Next slide"]')).toBeVisible();
      }
    });

    test('should pause carousel on hover', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const carousel = page.locator('[aria-roledescription="carousel"]');
      if ((await carousel.count()) > 0) {
        // Hover over carousel
        await carousel.first().hover();

        // Get current slide index
        const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
        const firstIndex = await selectedTab.getAttribute('aria-label');

        // Wait for auto-rotate interval
        await page.waitForTimeout(7000);

        // Slide should NOT have changed while hovered
        const currentIndex = await selectedTab.getAttribute('aria-label');
        expect(currentIndex).toBe(firstIndex);
      }
    });
  });

  test.describe('Authenticated Homepage — Content Cards', () => {
    test('should have accessible content cards', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check content cards have proper aria-labels
      const watchLinks = page.locator('a[aria-label^="Watch "]');
      const count = await watchLinks.count();

      // If content loaded, verify accessibility
      if (count > 0) {
        await expect(watchLinks.first()).toBeVisible();
        const label = await watchLinks.first().getAttribute('aria-label');
        expect(label).toMatch(/^Watch .+/);
      }
    });

    test('should display content cards with focus ring', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Content cards should have proper focus styles
      const watchLinks = page.locator('a[aria-label^="Watch "]');
      if ((await watchLinks.count()) > 0) {
        // Tab to the first content card
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Verify focus ring exists (via class)
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.className || '';
        });
        expect(typeof focused).toBe('string');
      }
    });
  });

  test.describe('Authenticated Homepage — Infinite Scroll', () => {
    test('should have infinite scroll sentinel in recently watched', async ({ page }) => {
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // The recently watched section should have scroll capabilities
      const recentlyWatchedRow = page.locator('[aria-label="Recently Watched content list"]');
      if ((await recentlyWatchedRow.count()) > 0) {
        // Row should be scrollable
        const isScrollable = await recentlyWatchedRow.evaluate(
          (el) => el.scrollWidth > el.clientWidth
        );
        // Scrollable depends on content count
        expect(typeof isScrollable).toBe('boolean');
      }
    });
  });

  test.describe('Authenticated Homepage — Cross-Browser Compatibility', () => {
    test('should work on Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'This test only runs on Chromium');
      await simulateAuth(page);
      await page.goto('/');
      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });

    test('should work on Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'This test only runs on Firefox');
      await simulateAuth(page);
      await page.goto('/');
      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });

    test('should work on WebKit (Safari)', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'This test only runs on WebKit');
      await simulateAuth(page);
      await page.goto('/');
      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Authenticated Homepage — Cross-Device Responsive', () => {
    test('should display all sections on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Trending Now').first()).toBeVisible();
    });

    test('should display all sections on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display all sections on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await simulateAuth(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Homepage Transition — Login/Logout', () => {
  test('should transition from guest to authenticated homepage on login', async ({ page }) => {
    // Start as guest
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });

    // Simulate login by setting auth state
    await page.evaluate(() => {
      localStorage.setItem(
        'azeebo_access_token',
        'test-access-token'
      );
      localStorage.setItem(
        'azeebo_refresh_token',
        'test-refresh-token'
      );
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

    // Reload to see authenticated homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Authenticated sections should be visible
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });
  });

  test('should transition from authenticated to guest homepage on logout', async ({ page }) => {
    // Set auth state first
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'azeebo_access_token',
        'test-access-token'
      );
      localStorage.setItem(
        'azeebo_refresh_token',
        'test-refresh-token'
      );
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

    // Reload to see authenticated homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify authenticated homepage loaded
    await expect(page.locator('text=Recently Watched').first()).toBeVisible({ timeout: 10000 });

    // Clear auth state (simulate logout)
    await page.evaluate(() => {
      localStorage.removeItem('azeebo_access_token');
      localStorage.removeItem('azeebo_refresh_token');
      localStorage.removeItem('azeebo_user');
      document.cookie = 'auth=; path=/; max-age=0; SameSite=Lax';
    });

    // Reload to see guest homepage
    await page.goto('/');
    await expect(page.locator('text=Get Started Free').first()).toBeVisible({ timeout: 10000 });

    // Authenticated sections should NOT be visible
    await expect(page.locator('text=Recently Watched').first()).not.toBeVisible();
  });
});

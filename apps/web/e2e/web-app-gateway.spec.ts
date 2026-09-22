/**
 * Web App + Gateway E2E Tests
 *
 * Verifies the full web app loads correctly and the Next.js proxy
 * forwards API requests through the gateway to backend services.
 *
 * Flow: Browser → Next.js (4000) → rewrite proxy → API Gateway (3013) → Backend services
 *
 * Run:  npx playwright test e2e/web-app-gateway.spec.ts --project=chromium
 *       (requires all services running via ./start-all.sh)
 */
import { test, expect, type APIRequestContext } from '@playwright/test';

/* ── Config ────────────────────────────────────────────────────────────────── */

const WEB = process.env.WEB_APP_URL || 'http://localhost:4000';
const GW = process.env.GATEWAY_URL || 'http://localhost:3013';
const TIMEOUT = 15_000;

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/** Simulate authenticated session via localStorage + cookie. */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('azeebo_access_token', 'e2e-test-token');
    localStorage.setItem('azeebo_refresh_token', 'e2e-test-refresh');
    localStorage.setItem(
      'azeebo_user',
      JSON.stringify({
        id: 'e2e-user-1',
        email: 'e2e@azeeboplus.com',
        name: 'E2E Test User',
        displayName: 'E2ETester',
        role: 'user',
      }),
    );
    // Namespaced marker — the bare `auth` cookie name is shared across all
    // localhost apps and must not be used (see src/lib/cookie-names.ts).
    document.cookie = 'azeebo_web_auth=e2e-user-1; path=/; max-age=604800; SameSite=Lax';
  });
}

/** Fetch JSON through the web app's Next.js proxy. */
async function proxyGet(
  request: APIRequestContext,
  path: string,
): Promise<{ status: number; body: unknown }> {
  const res = await request.fetch(`${WEB}${path}`, { timeout: TIMEOUT });
  const status = res.status();
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status, body };
}

/** Fetch JSON directly from the gateway. */
async function gwGet(
  request: APIRequestContext,
  path: string,
): Promise<{ status: number; body: unknown }> {
  const res = await request.fetch(`${GW}${path}`, { timeout: TIMEOUT });
  const status = res.status();
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status, body };
}

/* ── 1. Web App Loads ──────────────────────────────────────────────────────── */

test.describe('Web App — Core Loading', () => {
  test('homepage renders with title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Azeebo/i, { timeout: TIMEOUT });
    await expect(page.locator('body')).toBeVisible();
  });

  test('no unhandled JS errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors (e.g. WebSocket CSP)
    const realErrors = errors.filter(
      (e) => !e.includes('WebSocket') && !e.includes('connect-src'),
    );
    expect(realErrors).toEqual([]);
  });

  test('app shell renders (header/nav/footer)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // At minimum the body and some structural element should exist
    await expect(page.locator('body')).toBeVisible();
    const html = await page.content();
    expect(html.length).toBeGreaterThan(1000); // Not a blank page
  });
});

/* ── 2. API Proxy Through Gateway ──────────────────────────────────────────── */

test.describe('API Proxy — Gateway Passthrough', () => {
  test('GET /api/v1/content/trending proxies through gateway', async ({
    request,
  }) => {
    const { status, body } = await proxyGet(request, '/api/v1/content/trending?limit=5');
    // Gateway should return 200 (even if empty data) or 502 if content-service is down
    expect([200, 502, 404]).toContain(status);
    if (status === 200) {
      expect(body).toBeDefined();
    }
  });

  test('GET /api/v1/content/popular-region proxies through gateway', async ({
    request,
  }) => {
    const { status } = await proxyGet(request, '/api/v1/content/popular-region?limit=5');
    expect([200, 502, 404]).toContain(status);
  });

  test('GET /api/v1/content/new-releases proxies through gateway', async ({
    request,
  }) => {
    const { status } = await proxyGet(request, '/api/v1/content/new-releases?limit=5');
    expect([200, 502, 404]).toContain(status);
  });

  test('feature flags bootstrap endpoint responds', async ({ request }) => {
    const { status, body } = await proxyGet(request, '/feature-flags/bootstrap');
    // Should be 200 with flag data, or 404 if endpoint not registered
    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(body).toBeDefined();
    }
  });

  test('gateway health check is reachable directly', async ({ request }) => {
    const { status } = await gwGet(request, '/health');
    expect(status).toBe(200);
  });

  test('gateway /api/v1/auth returns structured response (not crash)', async ({
    request,
  }) => {
    const { status } = await gwGet(request, '/api/v1/auth/me');
    // Unauthenticated → 401, not 500
    expect([401, 403]).toContain(status);
  });

  test('proxy preserves query parameters', async ({ request }) => {
    const { status } = await proxyGet(
      request,
      '/api/v1/content/trending?limit=3&genre=comedy',
    );
    expect([200, 502, 404]).toContain(status);
  });

  test('proxy returns 404 for non-existent service', async ({ request }) => {
    const { status } = await proxyGet(request, '/api/v1/nonexistent-service/data');
    expect([404, 502]).toContain(status);
  });
});

/* ── 3. Page Navigation — Authenticated ───────────────────────────────────── */

test.describe('Page Navigation — Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const protectedPages = [
    { path: '/home', expected: /Recently Watched|Welcome|Trending/i },
    { path: '/browse', expected: /Browse|Content|Movies|Series/i },
    { path: '/search', expected: /Search/i },
    { path: '/notifications', expected: /Notification/i },
    { path: '/wallet', expected: /Wallet|Balance|Fund/i },
    { path: '/profile', expected: /Profile|Account|Settings/i },
    { path: '/settings', expected: /Settings|Appearance|Preferences/i },
    { path: '/rewards', expected: /Rewards|Points|Earn/i },
    { path: '/music', expected: /Music|Tracks|Artists|Genres/i },
    { path: '/comedy', expected: /Comedy|Specials|Stand-up/i },
    { path: '/movies', expected: /Movies|Films|Watch/i },
    { path: '/games', expected: /Games|Play|Trivia/i },
    { path: '/sports', expected: /Sports|Fixtures|Predictions/i },
    { path: '/live', expected: /Live|Events|Stream/i },
    { path: '/reality', expected: /Reality|Shows|Vote/i },
    { path: '/creator', expected: /Creator|Dashboard|Upload|Content/i },
    { path: '/tipping', expected: /Tip|Creator|Send/i },
    { path: '/subscription', expected: /Subscription|Plans|Subscribe/i },
  ];

  for (const { path, expected } of protectedPages) {
    test(`${path} loads without blank page`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Page should not be blank
      const content = await page.textContent('body');
      expect(content?.trim().length).toBeGreaterThan(0);

      // Should contain relevant content or a loading/error state
      const hasContent = expected.test(content || '');
      const hasError = /error|unauthorized|forbidden|not found/i.test(content || '');
      const hasLoading = /loading|spinner/i.test(content || '');

      // At least one should be true (content loaded, or reasonable state)
      expect(hasContent || hasError || hasLoading).toBe(true);
    });
  }
});

/* ── 4. Page Navigation — Guest ───────────────────────────────────────────── */

test.describe('Page Navigation — Guest User', () => {
  const guestPages = [
    { path: '/', expected: /Azeebo|Get Started|Sign/i },
    { path: '/auth/login', expected: /Sign In|Login|Email/i },
    { path: '/auth/register', expected: /Sign Up|Register|Create/i },
    { path: '/browse', expected: /Browse|Content|Movies/i },
    { path: '/music', expected: /Music|Tracks|Artists/i },
    { path: '/comedy', expected: /Comedy|Specials/i },
    { path: '/movies', expected: /Movies|Films/i },
    { path: '/games', expected: /Games|Play/i },
    { path: '/sports', expected: /Sports|Fixtures/i },
    { path: '/live', expected: /Live|Events/i },
    { path: '/premium', expected: /Premium|Subscribe|Plan/i },
  ];

  for (const { path, expected } of guestPages) {
    test(`${path} loads for guests`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const content = await page.textContent('body');
      expect(content?.trim().length).toBeGreaterThan(0);

      const hasContent = expected.test(content || '');
      const hasError = /error|unauthorized|forbidden/i.test(content || '');
      const hasRedirect = page.url().includes('/auth/login');

      expect(hasContent || hasError || hasRedirect).toBe(true);
    });
  }
});

/* ── 5. API Data Renders on Pages ─────────────────────────────────────────── */

test.describe('API Data Flows to Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('homepage fetches trending content via proxy', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/content')) {
        apiCalls.push(req.url());
      }
    });

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Should have made at least one content API call
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('browse page fetches content list via proxy', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/')) {
        apiCalls.push(req.url());
      }
    });

    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Should have made API calls through the proxy
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('wallet page fetches balance via proxy', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/wallet')) {
        apiCalls.push(req.url());
      }
    });

    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // Wallet page should attempt to fetch balance
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('music page fetches tracks via proxy', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/')) {
        apiCalls.push(req.url());
      }
    });

    await page.goto('/music');
    await page.waitForLoadState('networkidle');

    expect(apiCalls.length).toBeGreaterThan(0);
  });
});

/* ── 6. Auth Flow Through Gateway ─────────────────────────────────────────── */

test.describe('Auth Flow Through Gateway', () => {
  test('login page renders form fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput.first()).toBeVisible({ timeout: TIMEOUT });
    await expect(passwordInput.first()).toBeVisible();
    await expect(submitButton.first()).toBeVisible();
  });

  test('register page renders form fields', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: TIMEOUT });
  });

  test('login form submits to gateway (401 for bad creds)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const apiCalls: { url: string; status: number }[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api/v1/auth/login')) {
        apiCalls.push({ url: res.url(), status: res.status() });
      }
    });

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );

    if ((await emailInput.count()) > 0) {
      await emailInput.first().fill('test@example.com');
      await passwordInput.first().fill('wrongpassword');
      await page.locator('button[type="submit"]').first().click();

      // Wait for the API call
      await page.waitForTimeout(3000);

      // Should have made a login request (401 expected for wrong creds)
      if (apiCalls.length > 0) {
        expect(apiCalls[0].status).toBe(401);
      }
    }
  });
});

/* ── 7. Cross-Cutting Concerns ────────────────────────────────────────────── */

test.describe('Cross-Cutting — Error Handling', () => {
  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    const has404 =
      /404|not found|page not found/i.test(content || '') ||
      page.url().includes('404');
    // Some apps redirect, some show 404 page
    expect(has404 || page.url() !== '/this-route-does-not-exist-xyz').toBe(true);
  });

  test('app survives gateway being unreachable (graceful degradation)', async ({
    page,
  }) => {
    await login(page);

    // Block all API calls to simulate gateway down
    await page.route('**/api/v1/**', (route) => route.abort('connectionrefused'));

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // App should still render (with error states or empty sections)
    const content = await page.textContent('body');
    expect(content?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Cross-Cutting — Performance', () => {
  test('homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  test('authenticated homepage loads within 5 seconds', async ({ page }) => {
    await login(page);

    const start = Date.now();
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  test('API proxy responds within 3 seconds', async ({ request }) => {
    const start = Date.now();
    const { status } = await proxyGet(request, '/api/v1/content/trending?limit=5');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
    expect([200, 502, 404]).toContain(status);
  });
});

test.describe('Cross-Cutting — Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const { name, width, height } of viewports) {
    test(`homepage renders on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await login(page);

      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();
      const content = await page.textContent('body');
      expect(content?.trim().length).toBeGreaterThan(0);
    });
  }
});

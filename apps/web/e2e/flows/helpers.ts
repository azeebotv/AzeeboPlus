/**
 * Shared helpers for E2E flow tests.
 *
 * Each test uses API mocking so the suite can run without a live backend.
 * Adjust selectors if the UI changes.
 */
import { type Page, type Expect, expect as baseExpect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const TEST_USER = {
  name: 'E2E Test User',
  email: `e2e-${Date.now()}@test.example.com`,
  password: 'TestPassword123!',
};

const TEST_CREATOR = {
  email: 'creator@example.com',
  password: 'CreatorPass123!',
};

const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
};

/** Register a new user via the UI. */
export async function registerUser(page: Page, overrides?: Partial<typeof TEST_USER>) {
  const user = { ...TEST_USER, ...overrides };
  await page.goto('/auth/register');
  await page.waitForSelector('input[name="displayName"], input[name="name"]', { timeout: 10000 });

  await page.fill('input[name="displayName"], input[name="name"]', user.name);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  // Some auth pages don't render a confirm-password field — only fill it
  // when present.
  const confirmInput = page.locator(
    'input[name="confirmPassword"], input[name="confirm-password"]',
  );
  if (await confirmInput.count()) {
    await confirmInput.first().fill(user.password);
  }

  // Tick agree checkbox if present
  const agreeCheckbox = page.locator('input[type="checkbox"]').first();
  if (await agreeCheckbox.isVisible().catch(() => false)) {
    await agreeCheckbox.check();
  }

  await page.click('button[type="submit"]');
  return user;
}

/** Login via the UI. */
export async function loginUser(
  page: Page,
  credentials: { email: string; password: string } = TEST_USER,
) {
  await page.goto('/auth/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });
}

/** Login as admin. */
export async function loginAsAdmin(page: Page) {
  await loginUser(page, TEST_ADMIN);
}

/** Login as creator. */
export async function loginAsCreator(page: Page) {
  await loginUser(page, TEST_CREATOR);
}

// ---------------------------------------------------------------------------
// Mock helpers — intercept API calls so tests run without a real backend
// ---------------------------------------------------------------------------

/**
 * Seed standard API mocks for a logged-in session.
 *
 * `seedSession: false` skips planting the localStorage session + cookie
 * consent — used by specs that exercise the logged-out/registration paths
 * (e.g. 01-signup) but still want the API mocks.
 */
export async function mockApiForAuth(page: Page, { seedSession = true }: { seedSession?: boolean } = {}) {
  // Auth session. NOTE: the client bootstraps its session from
  // GET /api/v1/users/me (user.getProfile), not /auth/me — both are mocked
  // for backward compatibility with older specs.
  //
  // AuthContext.isAuthenticed requires a stored token (localStorage
  // `azeebo_access_token` + cached user), so seed those before any app code
  // runs — the /users/me route below then validates the session.
  if (seedSession) {
  await page.addInitScript(
    ({ userKey, userValue, accessKey, refreshKey }) => {
      window.localStorage.setItem(userKey, userValue);
      window.localStorage.setItem(accessKey, 'e2e-access-token');
      window.localStorage.setItem(refreshKey, 'e2e-refresh-token');
    },
    {
      userKey: 'azeebo_user',
      userValue: JSON.stringify({
        id: 'user-001',
        email: TEST_USER.email,
        name: TEST_USER.name,
        displayName: TEST_USER.name,
        role: 'user',
      }),
      accessKey: 'azeebo_access_token',
      refreshKey: 'azeebo_refresh_token',
    },
  );
  }

  // Pre-accept the cookie banner so its fixed bottom bar can't overlap
  // click targets (the banner parks itself over the page at z-50 until a
  // version-keyed consent entry exists in localStorage). Applied even for
  // unseeded sessions — it never affects auth state.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'azeebo_cookie_consent',
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
        version: '1.0',
      })
    );
  });

  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'user-001',
          email: TEST_USER.email,
          displayName: TEST_USER.name,
          role: 'user',
        },
      }),
    }),
  );

  await page.route('**/api/v1/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'user-001',
          email: TEST_USER.email,
          displayName: TEST_USER.name,
          name: TEST_USER.name,
          role: 'user',
        },
      }),
    }),
  );

  // Session bootstrap falls back to refresh when no token is in localStorage;
  // mock it so clearSession() never wipes the mocked state mid-test.
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          access_token: 'e2e-access-token',
          refresh_token: 'e2e-refresh-token',
          user: {
            id: 'user-001',
            email: TEST_USER.email,
            displayName: TEST_USER.name,
            role: 'user',
          },
        },
      }),
    }),
  );

  // Wallet balance
  await page.route('**/api/v1/wallet/balance', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { balance: 500000, currency: 'NGN' },
      }),
    }),
  );
}

/** Seed mocks for the reality voting flow. */
export async function mockApiForVoting(page: Page) {
  await mockApiForAuth(page);

  // Page calls api.reality.getContestants → /reality/shows/:id/contestants
  await page.route('**/api/v1/reality/shows/*/contestants', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'c1', name: 'Contestant Alpha', avatar: '/avatars/a.png', votes: 1200, status: 'safe' },
          { id: 'c2', name: 'Contestant Beta', avatar: '/avatars/b.png', votes: 800, status: 'danger' },
          { id: 'c3', name: 'Contestant Gamma', avatar: '/avatars/c.png', votes: 950, status: 'safe' },
        ],
      }),
    }),
  );

  // Page POSTs /reality/votes/quantity { contestantId, quantity }
  await page.route('**/api/v1/reality/votes/quantity', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Vote recorded', data: { recorded: true } }),
    }),
  );

  // Legacy single-vote shape used by older specs
  await page.route('**/api/v1/reality/votes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Vote recorded', data: { recorded: true } }),
    }),
  );
}

/** Seed mocks for payment flows. */
export async function mockApiForPayments(page: Page) {
  await mockApiForAuth(page);

  await page.route('**/api/v1/payments/initialize', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { reference: 'pay_ref_001', authorizationUrl: 'https://checkout.paystack.com/test' },
      }),
    }),
  );

  await page.route('**/api/v1/payments/verify/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { status: 'success', amount: 5000, currency: 'NGN' },
      }),
    }),
  );

  await page.route('**/api/v1/wallet/fund', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Wallet funded' }),
    }),
  );

  await page.route('**/api/v1/wallet/transactions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 't1', type: 'credit', amount: 5000, description: 'Wallet funding', createdAt: new Date().toISOString() },
          { id: 't2', type: 'debit', amount: 1000, description: 'Vote purchase', createdAt: new Date().toISOString() },
        ],
      }),
    }),
  );
}

/** Seed mocks for content CRUD. */
export async function mockApiForContent(page: Page) {
  await mockApiForAuth(page);

  await page.route('**/api/v1/content**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'v1', title: 'Test Video', type: 'video', status: 'published', views: 1500 },
            { id: 'v2', title: 'Draft Video', type: 'video', status: 'draft', views: 0 },
          ],
        }),
      });
    }
    // POST / PUT / DELETE
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { id: 'v-new' } }),
    });
  });
}

/** Seed mocks for subscription flow. */
export async function mockApiForSubscription(page: Page) {
  await mockApiForAuth(page);

  await page.route('**/api/v1/subscriptions/plans', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'free', name: 'Free', price: 0, features: ['Basic content'] },
          { id: 'premium', name: 'Premium', price: 2500, features: ['All content', 'No ads', 'HD'] },
          { id: 'ultimate', name: 'Ultimate', price: 5000, features: ['Everything', 'Exclusive', '4K'] },
        ],
      }),
    }),
  );

  await page.route('**/api/v1/subscriptions/current', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: null,
      }),
    }),
  );

  await page.route('**/api/v1/subscriptions/subscribe', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { subscriptionId: 'sub-001', plan: 'premium', status: 'active' },
      }),
    }),
  );

  await page.route('**/api/v1/payments/initialize', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { reference: 'sub_pay_001', authorizationUrl: 'https://checkout.paystack.com/test' },
      }),
    }),
  );
}

/** Seed mocks for tipping flow. */
export async function mockApiForTipping(page: Page) {
  await mockApiForAuth(page);

  await page.route('**/api/v1/tipping/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { totalTips: 24, totalAmount: 48500, topTier: 'gold' },
      }),
    }),
  );

  await page.route('**/api/v1/tipping/history*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            { id: 'tip-1', creatorId: 'creator-1', creatorName: 'Comedy King', amount: 1000, tier: 'gold', message: 'Love your content!', createdAt: '2026-08-20T10:00:00Z' },
            { id: 'tip-2', creatorId: 'creator-2', creatorName: 'DJ Master', amount: 500, tier: 'silver', message: null, createdAt: '2026-08-18T15:30:00Z' },
            { id: 'tip-3', creatorId: 'creator-3', creatorName: 'Sports Analyst', amount: 2500, tier: 'platinum', message: 'Great analysis', createdAt: '2026-08-15T08:00:00Z' },
          ],
          total: 24,
          totalPages: 3,
        },
      }),
    }),
  );

  await page.route('**/api/v1/tipping/send', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Tip sent successfully' }),
      });
    }
    route.fallback();
  });
}

/** Seed mocks for games flow. */
export async function mockApiForGames(page: Page) {
  await mockApiForAuth(page);

  await page.route('**/api/v1/universes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'universe-games', name: 'games', slug: 'games', enabled: true },
          { id: 'universe-movies', name: 'movie', slug: 'movies', enabled: true },
          { id: 'universe-reality', name: 'reality', slug: 'reality', enabled: true },
        ],
      }),
    }),
  );

  await page.route('**/api/v1/content/universe/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'game-1', title: 'Trivia Master', description: 'Test your knowledge across categories', thumbnail: '/images/game1.jpg', contentType: 'trivia', views: 15000 },
          { id: 'game-2', title: 'Word Puzzle', description: 'Unscramble words to score points', thumbnail: '/images/game2.jpg', contentType: 'puzzle', views: 8500 },
          { id: 'game-3', title: 'Speed Challenge', description: 'Race against the clock in rapid-fire rounds', thumbnail: '/images/game3.jpg', contentType: 'arcade', views: 22000 },
          { id: 'game-4', title: 'Brain Buster', description: 'Logic puzzles that challenge your mind', thumbnail: '/images/game4.jpg', contentType: 'strategy', views: 5200 },
          { id: 'game-5', title: 'Lucky Spin', description: 'Spin the wheel and win rewards', thumbnail: '/images/game5.jpg', contentType: 'casual', views: 31000 },
          { id: 'game-6', title: 'Card Royale', description: 'Strategic card battles with real prizes', thumbnail: '/images/game6.jpg', contentType: 'card', views: 9800 },
        ],
      }),
    }),
  );
}

/** Seed mocks for notifications flow. */
export async function mockApiForNotifications(page: Page) {
  await mockApiForAuth(page);

  await page.route('**/api/v1/notifications', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            notifications: [
              { id: 'n1', type: 'like', title: 'New Like', message: 'Comedy King liked your comment', timestamp: '2026-08-29T10:00:00Z', readAt: null },
              { id: 'n2', type: 'follow', title: 'New Follower', message: 'DJ Master started following you', timestamp: '2026-08-29T09:30:00Z', readAt: null },
              { id: 'n3', type: 'comment', title: 'New Comment', message: 'Sports Analyst replied: "Great take!"', timestamp: '2026-08-28T18:00:00Z', readAt: '2026-08-28T19:00:00Z' },
              { id: 'n4', type: 'mention', title: 'You were mentioned', message: '@testuser check this out', timestamp: '2026-08-27T12:00:00Z', readAt: null },
              { id: 'n5', type: 'system', title: 'System Update', message: 'Your subscription has been renewed', timestamp: '2026-08-25T08:00:00Z', readAt: '2026-08-25T08:30:00Z' },
            ],
          },
        }),
      });
    }
    route.fallback();
  });

  await page.route('**/api/v1/notifications/*/read', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
    route.fallback();
  });

  await page.route('**/api/v1/notifications/read-all', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
    route.fallback();
  });
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Wait for toast / snackbar notification and assert text. */
export async function expectToast(page: Page, text: string | RegExp, timeout = 10000) {
  const toast = page.locator('[role="status"], [data-toast], .toast, [class*="Toast"]').filter({ hasText: text });
  await expect(toast.first()).toBeVisible({ timeout });
}

/** Assert that the page URL matches. */
export async function expectUrl(page: Page, pattern: string | RegExp) {
  await expect(page).toHaveURL(pattern);
}

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
  await page.fill('input[name="confirmPassword"], input[name="confirm-password"]', user.password);

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

/** Seed standard API mocks for a logged-in session. */
export async function mockApiForAuth(page: Page) {
  // Auth session
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

  await page.route('**/api/v1/reality/contestants*', (route) =>
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

  await page.route('**/api/v1/reality/vote', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Vote recorded' }),
    }),
  );

  await page.route('**/api/v1/reality/supervote', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Super vote recorded' }),
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

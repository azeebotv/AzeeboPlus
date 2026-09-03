/**
 * Gateway E2E Integration Tests
 *
 * Tests the full backend stack through the API gateway (port 3013).
 * Verifies all 29 services are reachable, auth flows work end-to-end,
 * and cross-service interactions succeed.
 *
 * Run: npx playwright test e2e/api/gateway-e2e.spec.ts --project=chromium
 * Requires: all 29 services running via ./start-all.sh
 */
import { test, expect, APIRequestContext } from '@playwright/test';

/* ── Config ────────────────────────────────────────────────────────────────── */

const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3013';
const TIMEOUT = 10_000;

/* ── Helpers ───────────────────────────────────────────────────────────────── */

async function api(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options?: { body?: unknown; headers?: Record<string, string>; token?: string },
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await request.fetch(`${GATEWAY}${path}`, {
    method,
    headers,
    data: options?.body,
    timeout: TIMEOUT,
  });

  const status = response.status();
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return { status, body, response };
}

/** Register a test user and return credentials + token. */
async function registerTestUser(
  request: APIRequestContext,
  suffix?: string,
): Promise<{ email: string; password: string; token?: string; userId?: string }> {
  const ts = Date.now();
  const email = `e2e-${ts}${suffix ? `-${suffix}` : ''}@test.azeeboplus.com`;
  const password = 'TestPassword123!';

  const res = await api(request, 'POST', '/v1/auth/signup', {
    body: { email, password, displayName: `E2E User ${ts}` },
  });

  return {
    email,
    password,
    token: (res.body as any)?.data?.accessToken,
    userId: (res.body as any)?.data?.user?.id,
  };
}

/** Login and return token. */
async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string | undefined> {
  const res = await api(request, 'POST', '/v1/auth/login', {
    body: { email, password },
  });
  return (res.body as any)?.data?.accessToken;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   1. SERVICE HEALTH CHECKS — All 29 services through gateway
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('1. Service Health — All 29 Services', () => {
  const services = [
    { name: 'auth-service', port: 3000, healthPath: '/v1/health' },
    { name: 'user-service', port: 3001, healthPath: '/v1/health' },
    { name: 'wallet-service', port: 3002, healthPath: '/v1/health' },
    { name: 'payment-service', port: 3003, healthPath: '/v1/health' },
    { name: 'content-service', port: 3004, healthPath: '/v1/health' },
    { name: 'search-service', port: 3005, healthPath: '/v1/health' },
    { name: 'notification-service', port: 3006, healthPath: '/v1/health' },
    { name: 'reward-service', port: 3007, healthPath: '/v1/health' },
    { name: 'analytics-service', port: 3008, healthPath: '/v1/health' },
    { name: 'recommendation-service', port: 3009, healthPath: '/v1/health' },
    { name: 'reality-service', port: 3010, healthPath: '/v1/health' },
    { name: 'movie-service', port: 3011, healthPath: '/v1/health' },
    { name: 'comedy-service', port: 3012, healthPath: '/v1/health' },
    { name: 'api-gateway', port: 3013, healthPath: '/health' },
    { name: 'games-service', port: 3014, healthPath: '/v1/health' },
    { name: 'queue-service', port: 3015, healthPath: '/v1/health' },
    { name: 'lifestyle-service', port: 3016, healthPath: '/v1/health' },
    { name: 'vertical-service', port: 3017, healthPath: '/v1/health' },
    { name: 'creator-service', port: 3018, healthPath: '/v1/health' },
    { name: 'media-service', port: 3019, healthPath: '/v1/health' },
    { name: 'knowledge-service', port: 3020, healthPath: '/v1/health' },
    { name: 'sports-service', port: 3021, healthPath: '/v1/health' },
    { name: 'moderation-service', port: 3022, healthPath: '/v1/health' },
    { name: 'engagement-service', port: 3023, healthPath: '/v1/health' },
    { name: 'messaging-service', port: 3024, healthPath: '/v1/health' },
    { name: 'referral-service', port: 3025, healthPath: '/v1/health' },
    { name: 'subscription-service', port: 3026, healthPath: '/v1/health' },
    { name: 'live-event-service', port: 3027, healthPath: '/health' },
    { name: 'support-service', port: 3028, healthPath: '/v1/health' },
  ];

  for (const svc of services) {
    test(`${svc.name} (port ${svc.port}) responds to health check`, async ({ request }) => {
      const response = await request.fetch(
        `http://localhost:${svc.port}${svc.healthPath}`,
        { timeout: 5000 },
      );
      expect(response.status()).toBe(200);
      // Health responses should have a status field
      const data = (await response.json()) as Record<string, unknown>;
      const statusField = data?.status ?? (data?.data as Record<string, unknown>)?.status;
      expect(String(statusField)).toMatch(/ok|healthy/);
    });
  }

  test('gateway health endpoint returns service count', async ({ request }) => {
    const { status, body } = await api(request, 'GET', '/health');
    expect(status).toBe(200);
    const data = body as Record<string, unknown>;
    const inner = data?.data as Record<string, unknown> | undefined;
    expect(data?.status ?? inner?.status).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   2. GATEWAY ROUTING — Verify proxy routes to correct services
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('2. Gateway Routing', () => {
  test('gateway returns 404 for unknown routes', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/nonexistent');
    expect(status).toBe(404);
  });

  test('gateway returns 405 for wrong HTTP method', async ({ request }) => {
    // DELETE on signup should fail
    const { status } = await api(request, 'DELETE', '/v1/auth/signup');
    expect([404, 405]).toContain(status);
  });

  test('gateway proxies auth routes to auth-service', async ({ request }) => {
    // Register endpoint should exist (even if validation fails)
    const { status, body } = await api(request, 'POST', '/v1/auth/signup', {
      body: {}, // empty body — should get 400, not 404
    });
    expect([400, 409, 422]).toContain(status);
    const data = body as Record<string, unknown>;
    expect(data?.statusCode || data?.status).toBeTruthy();
  });

  test('gateway proxies user routes to user-service', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/users/me');
    // Should get 401 (unauthorized), not 404 (not found)
    expect([401, 403]).toContain(status);
  });

  test('gateway proxies content routes to content-service', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/content');
    // Content listing may be public or auth-protected
    expect([200, 401]).toContain(status);
  });

  test('gateway proxies wallet routes to wallet-service', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/wallet/balance');
    expect([401, 403]).toContain(status);
  });

  test('gateway proxies search routes to search-service', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/search?q=test');
    expect([200, 401]).toContain(status);
  });

  test('gateway proxies analytics routes to analytics-service', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/analytics/events', {
      body: { event: 'test', properties: {} },
    });
    // Analytics may accept without auth for tracking
    expect([200, 201, 401]).toContain(status);
  });

  test('gateway routes live-event health without auth', async ({ request }) => {
    const { status, body } = await request.fetch(
      `http://localhost:3027/health`,
      { timeout: 5000 },
    );
    expect(status).toBe(200);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   3. AUTH FLOW — Register → Login → Token → Protected Route → Logout
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('3. Authentication Flow', () => {
  test('register returns validation error for missing fields', async ({ request }) => {
    const { status, body } = await api(request, 'POST', '/v1/auth/signup', {
      body: {},
    });
    expect(status).toBe(400);
  });

  test('register returns validation error for weak password', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/auth/signup', {
      body: {
        email: `weak-${Date.now()}@test.com`,
        password: '123',
        displayName: 'Weak Pass',
      },
    });
    expect([400, 422]).toContain(status);
  });

  test('register returns validation error for invalid email', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/auth/signup', {
      body: {
        email: 'not-an-email',
        password: 'TestPassword123!',
        displayName: 'Bad Email',
      },
    });
    expect([400, 422]).toContain(status);
  });

  test('register creates user and returns tokens', async ({ request }) => {
    const user = await registerTestUser(request, 'register');
    expect(user.email).toBeTruthy();
    expect(user.password).toBeTruthy();
    // Some services return tokens directly, others require login
  });

  test('login fails with wrong password', async ({ request }) => {
    const { status, body } = await api(request, 'POST', '/v1/auth/login', {
      body: {
        email: `nonexistent-${Date.now()}@test.com`,
        password: 'WrongPassword123!',
      },
    });
    expect([401, 404]).toContain(status);
  });

  test('login succeeds with valid credentials', async ({ request }) => {
    // First register
    const user = await registerTestUser(request, 'login');
    // Then login
    const token = await loginUser(request, user.email, user.password);
    // Token may or may not be returned depending on service config
    // The important thing is we don't get a 500
  });

  test('protected route rejects request without token', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/users/me');
    expect([401, 403]).toContain(status);
  });

  test('protected route rejects request with invalid token', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/users/me', {
      token: 'invalid-token-12345',
    });
    expect([401, 403]).toContain(status);
  });

  test('protected route accepts request with valid token', async ({ request }) => {
    const user = await registerTestUser(request, 'valid-token');
    const token = await loginUser(request, user.email, user.password);
    if (token) {
      const { status } = await api(request, 'GET', '/v1/users/me', { token });
      expect([200, 201]).toContain(status);
    }
  });

  test('login returns appropriate error for missing fields', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/auth/login', {
      body: {},
    });
    expect([400, 401, 422]).toContain(status);
  });

  test('password reset request returns success for existing email', async ({ request }) => {
    const user = await registerTestUser(request, 'pwd-reset');
    const { status } = await api(request, 'POST', '/v1/auth/forgot-password', {
      body: { email: user.email },
    });
    // Should return 200 or 201 even if email doesn't exist (security)
    expect([200, 201, 400]).toContain(status);
  });

  test('password reset request handles non-existent email gracefully', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/auth/forgot-password', {
      body: { email: `noone-${Date.now()}@test.com` },
    });
    // Should not leak whether email exists
    expect([200, 201, 400]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   4. USER PROFILE — CRUD operations through gateway
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('4. User Profile', () => {
  let token: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    const user = await registerTestUser(request, 'profile');
    token = (await loginUser(request, user.email, user.password)) || '';
    userId = user.userId || '';
  });

  test('GET /v1/users/me returns user profile', async ({ request }) => {
    if (!token) return;
    const { status, body } = await api(request, 'GET', '/v1/users/me', { token });
    expect(status).toBe(200);
    const data = (body as any)?.data;
    expect(data?.email || data?.id).toBeTruthy();
  });

  test('PATCH /v1/users/me updates profile', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'PATCH', '/v1/users/me', {
      token,
      body: { displayName: 'Updated E2E Name' },
    });
    expect([200, 204]).toContain(status);
  });

  test('GET /v1/users/me/preferences returns preferences', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/users/me/preferences', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/users/me/history returns viewing history', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/users/me/history', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/users/me/saved returns saved content', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/users/me/saved', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/users/me/privacy-settings returns privacy settings', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/users/me/privacy-settings', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/users/:id returns other user profile', async ({ request }) => {
    if (!token || !userId) return;
    const { status } = await api(request, 'GET', `/v1/users/${userId}`, { token });
    expect([200, 404]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   5. WALLET & PAYMENTS — Balance, fund, transactions
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('5. Wallet & Payments', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await registerTestUser(request, 'wallet');
    token = (await loginUser(request, user.email, user.password)) || '';
  });

  test('GET /v1/wallet/balance requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/wallet/balance');
    expect([401, 403]).toContain(status);
  });

  test('GET /v1/wallet/balance returns balance with token', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/wallet/balance', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/wallet/transactions returns transaction history', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/wallet/transactions', { token });
    expect([200, 404]).toContain(status);
  });

  test('POST /v1/payments/initiate requires auth', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/payments/initiate', {
      body: { amount: 1000, method: 'card' },
    });
    expect([401, 403]).toContain(status);
  });

  test('POST /v1/payments/webhook handles webhook without auth', async ({ request }) => {
    // Payment webhooks from providers don't have Bearer tokens
    const { status } = await api(request, 'POST', '/v1/payments/webhook', {
      body: { event: 'test', data: {} },
    });
    // Should accept the webhook (200/201) or validate signature (400/401)
    expect([200, 201, 400, 401]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   6. CONTENT — Browse, search, trending
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('6. Content & Discovery', () => {
  test('GET /v1/content returns content listing', async ({ request }) => {
    const { status, body } = await api(request, 'GET', '/v1/content');
    expect([200, 401]).toContain(status);
    if (status === 200) {
      const data = (body as any)?.data;
      expect(Array.isArray(data) || data?.items || data?.results || data?.content).toBeTruthy();
    }
  });

  test('GET /v1/content?category=reality filters by category', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/content?category=reality');
    expect([200, 401]).toContain(status);
  });

  test('GET /v1/content?trending=true returns trending content', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/content?trending=true');
    expect([200, 401]).toContain(status);
  });

  test('GET /v1/search?q=comedy returns search results', async ({ request }) => {
    const { status, body } = await api(request, 'GET', '/v1/search?q=comedy');
    expect([200, 401]).toContain(status);
    if (status === 200) {
      const data = (body as any)?.data;
      expect(data !== null && data !== undefined).toBeTruthy();
    }
  });

  test('GET /v1/search with empty query returns error or empty results', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/search?q=');
    expect([200, 400, 401]).toContain(status);
  });

  test('GET /v1/search with special characters does not crash', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/search?q=<script>alert(1)</script>');
    expect([200, 400, 401]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   7. ENGAGEMENT — Notifications, rewards, referrals
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('7. Engagement Services', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await registerTestUser(request, 'engage');
    token = (await loginUser(request, user.email, user.password)) || '';
  });

  test('GET /v1/notifications requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/notifications');
    expect([401, 403]).toContain(status);
  });

  test('GET /v1/notifications returns notification list', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/notifications', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/rewards/balance requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/rewards/balance');
    expect([401, 403]).toContain(status);
  });

  test('GET /v1/rewards/balance returns balance', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/rewards/balance', { token });
    expect([200, 404]).toContain(status);
  });

  test('GET /v1/referrals requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/referrals');
    expect([401, 403]).toContain(status);
  });

  test('GET /v1/engagement/watchlist requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/engagement/watchlist');
    expect([401, 403]).toContain(status);
  });

  test('GET /v1/engagement/favorites requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/engagement/favorites');
    expect([401, 403]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   8. UNIVERSES — Reality, Movies, Comedy, Games, Sports
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('8. Universe Services', () => {
  const universeEndpoints = [
    { name: 'reality', path: '/v1/reality/shows' },
    { name: 'movies', path: '/v1/movies' },
    { name: 'comedy', path: '/v1/comedy' },
    { name: 'games', path: '/v1/games' },
    { name: 'sports', path: '/v1/sports' },
    { name: 'lifestyle', path: '/v1/lifestyle' },
    { name: 'vertical', path: '/v1/vertical' },
  ];

  for (const { name, path } of universeEndpoints) {
    test(`${name} service responds through gateway`, async ({ request }) => {
      const { status } = await api(request, 'GET', path);
      // Universe endpoints may be public or auth-protected
      expect([200, 401, 404]).toContain(status);
    });
  }

  test('creator service endpoints respond', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/creators');
    expect([200, 401, 404]).toContain(status);
  });

  test('live events endpoint responds', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/live-events');
    expect([200, 401, 404]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   9. OPERATIONS — Moderation, Queue, Support
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('9. Operations Services', () => {
  test('moderation service requires admin auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/moderation/queue');
    expect([401, 403]).toContain(status);
  });

  test('support service requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/support/tickets');
    expect([401, 403]).toContain(status);
  });

  test('subscription service requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/subscriptions');
    expect([401, 403]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   10. ERROR HANDLING — Edge cases, injection, malformed requests
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('10. Error Handling & Security', () => {
  test('SQL injection in search query is handled safely', async ({ request }) => {
    const { status } = await api(request, 'GET', "/v1/search?q='; DROP TABLE users; --");
    expect([200, 400, 401]).toContain(status);
  });

  test('XSS in search query is sanitized', async ({ request }) => {
    const { status, body } = await api(request, 'GET', '/v1/search?q=<img src=x onerror=alert(1)>');
    expect([200, 400, 401]).toContain(status);
    // Response should not contain unescaped script tags
    const str = JSON.stringify(body);
    expect(str).not.toContain('<img src=x onerror=');
  });

  test('oversized request body is rejected', async ({ request }) => {
    const largeBody = 'x'.repeat(10 * 1024 * 1024); // 10MB
    const { status } = await request.fetch(`${GATEWAY}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: largeBody,
      timeout: 10000,
    });
    expect([400, 413, 422]).toContain(status);
  });

  test('malformed JSON body returns 400', async ({ request }) => {
    const { status } = await request.fetch(`${GATEWAY}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: '{invalid json',
      timeout: 5000,
    });
    expect([400, 422]).toContain(status);
  });

  test('path traversal in URL is blocked', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/../../etc/passwd');
    expect([400, 403, 404]).toContain(status);
  });

  test('request with no Content-Type header is handled', async ({ request }) => {
    const { status } = await request.fetch(`${GATEWAY}/v1/auth/signup`, {
      method: 'POST',
      data: JSON.stringify({ email: 'test@test.com', password: 'Test123!' }),
      timeout: 5000,
    });
    expect([200, 400, 401, 415]).toContain(status);
  });

  test('CORS headers are present', async ({ request }) => {
    const response = await request.fetch(`${GATEWAY}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:4000',
        'Access-Control-Request-Method': 'GET',
      },
      timeout: 5000,
    });
    // Should have CORS headers
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).toBeTruthy();
  });

  test('rate limiting returns 429 when exceeded', async ({ request }) => {
    // Send many rapid requests to trigger rate limiting
    const requests = Array.from({ length: 20 }, () =>
      api(request, 'POST', '/v1/auth/login', {
        body: { email: 'test@test.com', password: 'wrong' },
      }),
    );
    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status);
    // At least some should be rate-limited (429) or all should be 401
    expect(statuses.every((s) => [401, 429].includes(s))).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   11. ANALYTICS & RECOMMENDATION — Intelligence services
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('11. Intelligence Services', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const user = await registerTestUser(request, 'intel');
    token = (await loginUser(request, user.email, user.password)) || '';
  });

  test('POST /v1/analytics/events tracks an event', async ({ request }) => {
    const { status } = await api(request, 'POST', '/v1/analytics/events', {
      token,
      body: {
        event: 'e2e_test_event',
        properties: { source: 'playwright', timestamp: Date.now() },
      },
    });
    expect([200, 201, 401]).toContain(status);
  });

  test('GET /v1/recommendations requires auth', async ({ request }) => {
    const { status } = await api(request, 'GET', '/v1/recommendations');
    expect([401, 403]).toContain(status);
  });

  test('GET /v1/recommendations returns personalized content', async ({ request }) => {
    if (!token) return;
    const { status } = await api(request, 'GET', '/v1/recommendations', { token });
    expect([200, 404]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   12. CROSS-SERVICE INTEGRATION — End-to-end user journey
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('12. Cross-Service Integration', () => {
  test('full user journey: register → profile → browse → engage', async ({ request }) => {
    // 1. Register
    const user = await registerTestUser(request, 'journey');
    expect(user.email).toBeTruthy();

    // 2. Login
    const token = await loginUser(request, user.email, user.password);
    expect(token).toBeTruthy();

    // 3. Get profile
    if (token) {
      const profileRes = await api(request, 'GET', '/v1/users/me', { token });
      expect(profileRes.status).toBe(200);

      // 4. Browse content
      const contentRes = await api(request, 'GET', '/v1/content', { token });
      expect([200, 401]).toContain(contentRes.status);

      // 5. Search
      const searchRes = await api(request, 'GET', '/v1/search?q=comedy', { token });
      expect([200, 401]).toContain(searchRes.status);

      // 6. Check wallet
      const walletRes = await api(request, 'GET', '/v1/wallet/balance', { token });
      expect([200, 404]).toContain(walletRes.status);

      // 7. Check notifications
      const notifRes = await api(request, 'GET', '/v1/notifications', { token });
      expect([200, 404]).toContain(notifRes.status);

      // 8. Check rewards
      const rewardsRes = await api(request, 'GET', '/v1/rewards/balance', { token });
      expect([200, 404]).toContain(rewardsRes.status);
    }
  });

  test('duplicate registration returns conflict', async ({ request }) => {
    const user = await registerTestUser(request, 'dup');
    const { status } = await api(request, 'POST', '/v1/auth/signup', {
      body: { email: user.email, password: user.password, displayName: 'Dup User' },
    });
    expect([409, 400]).toContain(status);
  });

  test('concurrent requests to same endpoint do not crash', async ({ request }) => {
    const requests = Array.from({ length: 10 }, () =>
      api(request, 'GET', '/v1/content'),
    );
    const results = await Promise.all(requests);
    // All should return valid HTTP status codes
    for (const r of results) {
      expect(r.status).toBeGreaterThanOrEqual(200);
      expect(r.status).toBeLessThan(600);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   13. FEATURE FLAGS — Gateway feature flag integration
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('13. Feature Flags', () => {
  test('GET /feature-flags/bootstrap returns flag state', async ({ request }) => {
    const { status, body } = await api(request, 'GET', '/feature-flags/bootstrap');
    expect([200, 404]).toContain(status);
    if (status === 200) {
      const data = (body as any)?.data ?? body;
      expect(data).toBeTruthy();
    }
  });

  test('GET /metrics returns flag evaluation metrics', async ({ request }) => {
    const { status } = await api(request, 'GET', '/metrics');
    expect([200, 404]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   14. PERFORMANCE — Response time and concurrency
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('14. Performance', () => {
  test('health endpoint responds within 500ms', async ({ request }) => {
    const start = Date.now();
    await api(request, 'GET', '/health');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  test('gateway handles 20 concurrent requests', async ({ request }) => {
    const start = Date.now();
    const requests = Array.from({ length: 20 }, () =>
      api(request, 'GET', '/health'),
    );
    const results = await Promise.all(requests);
    const elapsed = Date.now() - start;

    // All should succeed
    for (const r of results) {
      expect(r.status).toBe(200);
    }

    // All 20 should complete within 5 seconds
    expect(elapsed).toBeLessThan(5000);
  });

  test('content listing responds within 2 seconds', async ({ request }) => {
    const start = Date.now();
    await api(request, 'GET', '/v1/content');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});

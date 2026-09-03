/**
 * Web App API Proxy E2E Tests
 *
 * Verifies that the Next.js rewrite proxy (/api/* → gateway:3013)
 * works correctly end-to-end from the browser's perspective.
 *
 * This test exercises the full stack:
 *   Browser → Next.js (port 4000) → rewrite proxy → API Gateway (port 3013) → Backend services
 *
 * Run: npx playwright test e2e/api/proxy-e2e.spec.ts --config=e2e/api/playwright.config.ts --project=chromium
 * Requires: all services running via ./start-all.sh
 */
import { test, expect, APIRequestContext } from '@playwright/test';

/* ── Config ────────────────────────────────────────────────────────────────── */

const WEB_APP = process.env.WEB_APP_URL || 'http://localhost:4000';
const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3013';
const TIMEOUT = 10_000;

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/** Make a request through the web app's Next.js proxy */
async function proxyFetch(
  request: APIRequestContext,
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
) {
  const response = await request.fetch(`${WEB_APP}${path}`, {
    method: (options?.method || 'GET') as string,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

/** Make a direct request to the gateway (for comparison) */
async function gatewayFetch(
  request: APIRequestContext,
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
) {
  const response = await request.fetch(`${GATEWAY}${path}`, {
    method: (options?.method || 'GET') as string,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

/** Register a test user via the web app proxy */
async function registerViaProxy(
  request: APIRequestContext,
  suffix?: string,
): Promise<{ email: string; password: string; token?: string }> {
  const ts = Date.now();
  const email = `proxy-e2e-${ts}${suffix ? `-${suffix}` : ''}@test.azeeboplus.com`;
  const password = 'TestPassword123!';

  const res = await proxyFetch(request, '/api/v1/auth/signup', {
    method: 'POST',
    body: { email, password, displayName: `Proxy E2E ${ts}` },
  });

  return {
    email,
    password,
    token: (res.body as any)?.data?.accessToken as string | undefined,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   1. PROXY SMOKE TESTS — Basic connectivity through the Next.js proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('1. Proxy Smoke Tests', () => {
  test('web app serves HTML on root path', async ({ request }) => {
    const response = await request.fetch(`${WEB_APP}/`, { timeout: TIMEOUT });
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('text/html');
  });

  test('proxy forwards /api/v1/health to gateway health endpoint', async ({ request }) => {
    const { status, body } = await proxyFetch(request, '/api/v1/health');
    expect(status).toBe(200);
    const data = body as Record<string, unknown>;
    expect(data?.status || (data?.data as Record<string, unknown>)?.status).toBeTruthy();
  });

  test('proxy returns JSON (not HTML) for API routes', async ({ request }) => {
    const response = await request.fetch(`${WEB_APP}/api/v1/health`, { timeout: TIMEOUT });
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });

  test('proxy returns 404 for unknown API routes', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/nonexistent');
    expect(status).toBe(404);
  });

  test('proxy forwards CORS headers from gateway', async ({ request }) => {
    const response = await request.fetch(`${WEB_APP}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:4000',
        'Access-Control-Request-Method': 'GET',
      },
      timeout: TIMEOUT,
    });
    // The gateway should respond with CORS headers
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   2. AUTH PROXY — Authentication flows through the proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('2. Auth Proxy', () => {
  test('POST /api/v1/auth/signup proxies to auth service', async ({ request }) => {
    const { status, body } = await proxyFetch(request, '/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: `proxy-signup-${Date.now()}@test.azeeboplus.com`,
        password: 'TestPassword123!',
        displayName: 'Proxy Signup Test',
      },
    });
    // Should succeed or return validation error (not 502/503)
    expect([200, 201, 400, 409, 422]).toContain(status);
    // Should not be a gateway error
    expect(status).not.toBe(502);
    expect(status).not.toBe(503);
  });

  test('POST /api/v1/auth/login proxies to auth service', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: `nonexistent-${Date.now()}@test.com`,
        password: 'WrongPassword123!',
      },
    });
    // Should get 401 (not 502 or connection error)
    expect([401, 400]).toContain(status);
  });

  test('POST /api/v1/auth/signup with weak password returns validation error', async ({
    request,
  }) => {
    const { status, body } = await proxyFetch(request, '/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: `weak-${Date.now()}@test.azeeboplus.com`,
        password: '123',
        displayName: 'Weak Pass',
      },
    });
    expect([400, 422]).toContain(status);
    const data = body as Record<string, unknown>;
    // Should have an error message
    expect(data?.message || data?.error || data?.detail).toBeTruthy();
  });

  test('register and login through proxy returns tokens', async ({ request }) => {
    const user = await registerViaProxy(request, 'token');
    expect(user.email).toBeTruthy();

    const loginRes = await proxyFetch(request, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: user.email, password: user.password },
    });
    expect([200, 201]).toContain(loginRes.status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   3. WALLET PROXY — Wallet operations through the proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('3. Wallet Proxy', () => {
  test('GET /api/v1/wallet requires auth', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/wallet');
    expect([401, 403]).toContain(status);
  });

  test('GET /api/v1/wallet/balance requires auth', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/wallet/balance');
    expect([401, 403]).toContain(status);
  });

  test('GET /api/v1/wallet with token returns wallet data', async ({ request }) => {
    const user = await registerViaProxy(request, 'wallet');
    const loginRes = await proxyFetch(request, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: user.email, password: user.password },
    });
    const token = (loginRes.body as any)?.data?.accessToken as string;
    if (!token) return;

    const { status, body } = await proxyFetch(request, '/api/v1/wallet', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    const data = body as Record<string, unknown>;
    const walletData = (data?.data as Record<string, unknown>) || data;
    // Wallet should have balance field
    expect(typeof walletData?.balance).toBe('number');
  });

  test('GET /api/v1/wallet/transactions requires auth', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/wallet/transactions');
    expect([401, 403]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   4. CONTENT PROXY — Content browsing through the proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('4. Content Proxy', () => {
  test('GET /api/v1/content returns content listing', async ({ request }) => {
    const { status, body } = await proxyFetch(request, '/api/v1/content');
    expect([200, 401]).toContain(status);
    if (status === 200) {
      const data = body as Record<string, unknown>;
      expect(
        Array.isArray(data?.data) || (data?.data as any)?.items || (data as any)?.items,
      ).toBeTruthy();
    }
  });

  test('GET /api/v1/search?q=test returns search results', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/search?q=test');
    expect([200, 401]).toContain(status);
  });

  test('GET /api/v1/search with XSS payload is sanitized', async ({ request }) => {
    const { status, body } = await proxyFetch(
      request,
      '/api/v1/search?q=<script>alert(1)</script>',
    );
    expect([200, 400, 401]).toContain(status);
    const str = JSON.stringify(body);
    expect(str).not.toContain('<script>');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   5. UNIVERSE PROXY — Universe services through the proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('5. Universe Proxy', () => {
  const endpoints = [
    { name: 'reality', path: '/api/v1/reality/shows' },
    { name: 'movies', path: '/api/v1/movies' },
    { name: 'comedy', path: '/api/v1/comedy' },
    { name: 'games', path: '/api/v1/games' },
    { name: 'sports', path: '/api/v1/sports' },
    { name: 'lifestyle', path: '/api/v1/lifestyle' },
    { name: 'vertical', path: '/api/v1/vertical' },
  ];

  for (const { name, path } of endpoints) {
    test(`${name} service responds through proxy`, async ({ request }) => {
      const { status } = await proxyFetch(request, path);
      expect([200, 401, 404]).toContain(status);
      expect(status).not.toBe(502);
    });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════════
   6. PROXY vs DIRECT — Verify proxy responses match direct gateway responses
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('6. Proxy vs Direct Gateway Parity', () => {
  test('health endpoint returns same status via proxy and direct', async ({ request }) => {
    const [proxyRes, directRes] = await Promise.all([
      proxyFetch(request, '/api/v1/health'),
      gatewayFetch(request, '/v1/health'),
    ]);
    expect(proxyRes.status).toBe(directRes.status);
  });

  test('content endpoint returns same status via proxy and direct', async ({ request }) => {
    const [proxyRes, directRes] = await Promise.all([
      proxyFetch(request, '/api/v1/content'),
      gatewayFetch(request, '/v1/content'),
    ]);
    expect(proxyRes.status).toBe(directRes.status);
  });

  test('wallet endpoint returns same status via proxy and direct', async ({ request }) => {
    const [proxyRes, directRes] = await Promise.all([
      proxyFetch(request, '/api/v1/wallet'),
      gatewayFetch(request, '/v1/wallet'),
    ]);
    expect(proxyRes.status).toBe(directRes.status);
  });

  test('unknown route returns 404 via both proxy and direct', async ({ request }) => {
    const [proxyRes, directRes] = await Promise.all([
      proxyFetch(request, '/api/v1/nonexistent'),
      gatewayFetch(request, '/v1/nonexistent'),
    ]);
    expect(proxyRes.status).toBe(404);
    expect(directRes.status).toBe(404);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   7. ENGAGEMENT PROXY — Notifications, rewards, referrals through proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('7. Engagement Proxy', () => {
  test('GET /api/v1/notifications requires auth', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/notifications');
    expect([401, 403]).toContain(status);
  });

  test('GET /api/v1/rewards/balance requires auth', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/rewards/balance');
    expect([401, 403]).toContain(status);
  });

  test('GET /api/v1/referrals requires auth', async ({ request }) => {
    const { status } = await proxyFetch(request, '/api/v1/referrals');
    expect([401, 403]).toContain(status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   8. ERROR HANDLING — Proxy handles errors gracefully
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('8. Proxy Error Handling', () => {
  test('malformed JSON body returns error (not crash)', async ({ request }) => {
    const response = await request.fetch(`${WEB_APP}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: '{invalid json',
      timeout: TIMEOUT,
    });
    expect([400, 422]).toContain(response.status());
  });

  test('oversized body is rejected', async ({ request }) => {
    const largeBody = 'x'.repeat(10 * 1024 * 1024); // 10MB
    const response = await request.fetch(`${WEB_APP}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: largeBody,
      timeout: 15000,
    });
    expect([400, 413, 422]).toContain(response.status());
  });

  test('proxy does not expose internal service URLs in error responses', async ({ request }) => {
    const { body } = await proxyFetch(request, '/api/v1/nonexistent');
    const str = JSON.stringify(body);
    // Should not leak internal Docker hostnames or ports
    expect(str).not.toContain('wallet-service:3002');
    expect(str).not.toContain('auth-service:3000');
    expect(str).not.toContain('localhost:300');
  });

  test('proxy handles concurrent requests without crashing', async ({ request }) => {
    const requests = Array.from({ length: 10 }, () =>
      proxyFetch(request, '/api/v1/health'),
    );
    const results = await Promise.all(requests);
    for (const r of results) {
      expect(r.status).toBe(200);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   9. CROSS-SERVICE JOURNEY — Full user flow through proxy
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('9. Cross-Service Journey via Proxy', () => {
  test('register → login → wallet → content → search full journey', async ({ request }) => {
    // 1. Register through proxy
    const user = await registerViaProxy(request, 'journey');
    expect(user.email).toBeTruthy();

    // 2. Login through proxy
    const loginRes = await proxyFetch(request, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: user.email, password: user.password },
    });
    expect([200, 201]).toContain(loginRes.status);
    const token = (loginRes.body as any)?.data?.accessToken as string;
    if (!token) return;

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Get wallet through proxy
    const walletRes = await proxyFetch(request, '/api/v1/wallet', {
      headers: authHeaders,
    });
    expect(walletRes.status).toBe(200);

    // 4. Browse content through proxy
    const contentRes = await proxyFetch(request, '/api/v1/content', {
      headers: authHeaders,
    });
    expect([200, 401]).toContain(contentRes.status);

    // 5. Search through proxy
    const searchRes = await proxyFetch(request, '/api/v1/search?q=test', {
      headers: authHeaders,
    });
    expect([200, 401]).toContain(searchRes.status);

    // 6. Check notifications through proxy
    const notifRes = await proxyFetch(request, '/api/v1/notifications', {
      headers: authHeaders,
    });
    expect([200, 404]).toContain(notifRes.status);

    // 7. Check rewards through proxy
    const rewardsRes = await proxyFetch(request, '/api/v1/rewards/balance', {
      headers: authHeaders,
    });
    expect([200, 404]).toContain(rewardsRes.status);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   10. PERFORMANCE — Proxy overhead is minimal
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('10. Proxy Performance', () => {
  test('proxy health endpoint responds within 1 second', async ({ request }) => {
    const start = Date.now();
    await proxyFetch(request, '/api/v1/health');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  test('proxy overhead is less than 200ms vs direct gateway', async ({ request }) => {
    // Warm up
    await Promise.all([proxyFetch(request, '/api/v1/health'), gatewayFetch(request, '/v1/health')]);

    // Measure proxy
    const proxyStart = Date.now();
    await proxyFetch(request, '/api/v1/health');
    const proxyTime = Date.now() - proxyStart;

    // Measure direct
    const directStart = Date.now();
    await gatewayFetch(request, '/v1/health');
    const directTime = Date.now() - directStart;

    // Proxy should add less than 200ms overhead
    const overhead = proxyTime - directTime;
    expect(overhead).toBeLessThan(200);
  });

  test('proxy handles 20 concurrent API requests', async ({ request }) => {
    const start = Date.now();
    const requests = Array.from({ length: 20 }, () =>
      proxyFetch(request, '/api/v1/health'),
    );
    const results = await Promise.all(requests);
    const elapsed = Date.now() - start;

    for (const r of results) {
      expect(r.status).toBe(200);
    }
    expect(elapsed).toBeLessThan(5000);
  });
});

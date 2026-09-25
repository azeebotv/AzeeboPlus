/**
 * Integration tests for the web app's cookie-first auth recovery in
 * lib/api/base.ts's apiFetch.
 *
 * Contract under test (the scenario that used to 401 forever):
 *   1. The 15-minute httpOnly access_token cookie has expired; the 7-day
 *      httpOnly refresh_token cookie is still valid.
 *   2. A page request goes out, the backend answers 401.
 *   3. apiFetch must POST /auth/refresh with NO body (credentials included —
 *      the cookie jar is the only token store), exactly once even when
 *      several requests fail in parallel.
 *   4. The backend rotates both tokens and plants them via Set-Cookie; the
 *      client must re-read the (now fresh) access cookie for the retry's
 *      Authorization header — never reuse the stale one — and the rotated
 *      refresh cookie must persist in the jar for the NEXT recovery.
 *   5. If refresh fails, the session is cleared exactly once with no retry
 *      loop, and skipAuthRetry must bypass recovery entirely.
 *
 * jsdom's document.cookie stands in for the browser cookie jar (httpOnly is
 * a network-layer flag, invisible here), and the fetch mock simulates the
 * backend's rotate-and-Set-Cookie behaviour by writing the jar directly.
 * The logout redirect is not asserted: jsdom cannot implement navigation.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type FetchMock = ReturnType<typeof vi.fn>;

interface RecordedCall {
  url: string;
  method: string;
  body?: unknown;
  credentials?: string;
  auth?: string;
}

function jsonRes(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

describe('apiFetch — cookie-first auth recovery', () => {
  let apiFetch: typeof import('../base').apiFetch;
  let fetchMock: FetchMock;
  let calls: RecordedCall[];
  let refreshCount: number;

  const installFetchMock = () => {
    calls = [];
    refreshCount = 0;
    fetchMock.mockImplementation(async (url: string | URL, init?: RequestInit) => {
      const urlStr = String(url);
      const headers = (init?.headers ?? {}) as Record<string, string>;
      calls.push({
        url: urlStr,
        method: (init?.method ?? 'GET').toUpperCase(),
        body: init?.body,
        credentials: init?.credentials,
        auth: headers['Authorization'],
      });

      if (urlStr.includes('/auth/refresh')) {
        refreshCount += 1;
        // Backend rotation: fresh access token + ROTATED refresh token, both
        // planted into the jar via Set-Cookie (simulated — jsdom jar holds
        // only what JS can see, which is exactly what getCookieToken reads).
        document.cookie = `access_token=access-${refreshCount}; path=/`;
        document.cookie = `refresh_token=refresh-${refreshCount}; path=/`;
        return jsonRes(200, {
          success: true,
          data: {
            access_token: `access-${refreshCount}`,
            refresh_token: `refresh-${refreshCount}`,
          },
        });
      }

      // Guarded endpoint: 401 unless the request carries the CURRENT access
      // token (stale or missing tokens are rejected — mirrors the gateway).
      if (
        headers['Authorization'] !== 'Bearer access-1' &&
        headers['Authorization'] !== 'Bearer access-2'
      ) {
        return jsonRes(401, { success: false, message: 'Unauthorized' });
      }
      return jsonRes(200, {
        success: true,
        data: { served: urlStr, sawAuth: headers['Authorization'] },
      });
    });
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://test.api');
    localStorage.clear();
    // Expired access cookie + valid refresh cookie: the recovery scenario.
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=refresh-0; path=/';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    installFetchMock();
    const mod = await import('../base.js');
    apiFetch = mod.apiFetch;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
  });

  it('silently refreshes on 401 and retries with the fresh cookie token', async () => {
    const result = await apiFetch<{ served: string; sawAuth: string }>('/widgets');

    expect(result.success).toBe(true);
    expect(result.data?.served).toContain('/widgets');
    // The retry was authenticated with the token from the post-rotation jar.
    expect(result.data?.sawAuth).toBe('Bearer access-1');

    const refreshes = calls.filter((c) => c.url.includes('/auth/refresh'));
    expect(refreshes).toHaveLength(1);
    // Cookie-only recovery: POST, credentials included, NO body tokens.
    expect(refreshes[0].method).toBe('POST');
    expect(refreshes[0].credentials).toBe('include');
    expect(refreshes[0].body).toBeUndefined();

    const widgetCalls = calls.filter((c) => c.url.includes('/widgets'));
    expect(widgetCalls).toHaveLength(2);
    // First attempt carried no (or an expired) header; the retry must not
    // reuse it — it mirrors the fresh cookie instead.
    expect(widgetCalls[1].auth).toBe('Bearer access-1');
    expect(widgetCalls[1].auth).not.toBe(widgetCalls[0].auth);
  });

  it('persists the rotated refresh cookie and chains the next recovery through it', async () => {
    // First recovery.
    await apiFetch('/widgets');
    expect(document.cookie).toContain('refresh_token=refresh-1');
    expect(document.cookie).toContain('access_token=access-1');

    // Let the single-flight window flush — sequential recoveries are minutes
    // apart in reality, never inside the 50ms parallel-401 coalescing window.
    await new Promise((resolve) => setTimeout(resolve, 60));

    // The access cookie expires again; the ROTATED refresh cookie is what
    // makes the second recovery possible.
    document.cookie = 'access_token=; Max-Age=0; path=/';
    const result = await apiFetch<{ sawAuth: string }>('/widgets');

    expect(result.success).toBe(true);
    expect(result.data?.sawAuth).toBe('Bearer access-2');
    expect(refreshCount).toBe(2); // rotation advanced, jar stayed valid
    expect(document.cookie).toContain('refresh_token=refresh-2');
  });

  it('single-flights parallel 401s through one refresh', async () => {
    const [a, b, c] = await Promise.all([
      apiFetch<{ sawAuth: string }>('/widgets'),
      apiFetch<{ sawAuth: string }>('/gadgets'),
      apiFetch<{ sawAuth: string }>('/gizmos'),
    ]);

    expect(a.success && b.success && c.success).toBe(true);
    expect(refreshCount).toBe(1);
    // Every retry picked up the single rotation's fresh token.
    for (const r of [a, b, c]) {
      expect(r.data?.sawAuth).toBe('Bearer access-1');
    }
  });

  it('returns 401 and clears the session exactly once when refresh fails', async () => {
    fetchMock.mockImplementation(async (url: string | URL, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        refreshCount += 1;
        // Expired refresh cookie — the backend refuses to rotate.
        return jsonRes(401, { success: false, message: 'Invalid refresh token' });
      }
      calls.push({
        url: urlStr,
        method: (init?.method ?? 'GET').toUpperCase(),
        auth: ((init?.headers ?? {}) as Record<string, string>)['Authorization'],
      });
      return jsonRes(401, { success: false, message: 'Unauthorized' });
    });

    const result = await apiFetch('/widgets');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
    expect((result as { message?: string }).message).toContain('Session expired');
    // Sanity: this scenario's calls actually happened through the new mock.
    expect(refreshCount).toBeGreaterThan(0);
    // No retry loop: one endpoint attempt, one refresh, nothing more.
    expect(calls.filter((c) => c.url.includes('/widgets'))).toHaveLength(1);
    expect(refreshCount).toBe(1);
    // Session cleared (redirect to /auth/expired-session is jsdom-untestable).
    expect(localStorage.getItem('azeebo_access_token')).toBeNull();
    expect(localStorage.getItem('azeebo_refresh_token')).toBeNull();
    expect(localStorage.getItem('azeebo_user')).toBeNull();
  });

  it('does not refresh twice when the retried request 401s again', async () => {
    fetchMock.mockImplementation(async (url: string | URL, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        refreshCount += 1;
        document.cookie = `access_token=access-${refreshCount}; path=/`;
        document.cookie = `refresh_token=refresh-${refreshCount}; path=/`;
        return jsonRes(200, { success: true, data: {} });
      }
      calls.push({ url: urlStr, method: 'GET' });
      void init;
      // Even the fresh token is rejected (e.g. revoked server-side).
      return jsonRes(401, { success: false, message: 'Unauthorized' });
    });

    const result = await apiFetch('/widgets');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(refreshCount).toBe(1); // retry-only-once guard held
    expect(calls.filter((c) => c.url.includes('/widgets'))).toHaveLength(2);
  });

  it('skips recovery entirely when skipAuthRetry is set', async () => {
    const result = await apiFetch('/widgets', { skipAuthRetry: true });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(refreshCount).toBe(0);
    expect(calls.filter((c) => c.url.includes('/widgets'))).toHaveLength(1);
  });
});

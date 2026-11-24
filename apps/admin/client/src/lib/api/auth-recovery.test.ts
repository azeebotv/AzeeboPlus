/**
 * Integration tests — admin auth recovery paths.
 *
 * Covers the three recovery flows that had real production bugs:
 *
 * 1. Refresh after token rotation — access tokens rotate on every
 *    /auth/refresh, so a 401 must recover via the refresh cookie and the
 *    retry must carry the NEW cookie token, not the pre-rotation one.
 * 2. Stale Authorization header — the localStorage copy of the token goes
 *    stale on the first rotation; it must never be attached (previously it
 *    401'd every request after a refresh, rendering pages empty).
 * 3. CSRF 403 recovery — the gateway mints CSRF tokens with an in-memory
 *    secret, so a gateway restart invalidates every cached token and
 *    mutations 403 forever. The client must re-bootstrap once and retry.
 *
 * These tests stub global fetch and drive the real module's apiFetch, so the
 * module-level single-flight state (refreshInFlight / csrfRecoveryInFlight)
 * and the cookie jar (jsdom document.cookie) participate for real.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIG_FETCH = globalThis.fetch;

/** Call log of every stubbed fetch, by URL. */
function callsTo(
  url: string
): Array<{ init: RequestInit | undefined; headers: Record<string, string> }> {
  return (fetchMock.mock.calls as Array<[string, RequestInit]>)
    .filter(([u]) => String(u).includes(url))
    .map(([, init]) => ({
      init,
      headers: (init?.headers ?? {}) as Record<string, string>,
    }));
}

const fetchMock = vi.fn();

async function freshBase() {
  // vi.resetModules() in beforeEach clears the registry, so this dynamic
  // import re-evaluates the module — each test starts with pristine
  // module-level single-flight state.
  return import('./base');
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
}
function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}
function clearAllAuthCookies() {
  ['access_token', '_csrf', '_csrf_client'].forEach(clearCookie);
}

/** Standard 200 envelope response. */
function okResponse(body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json', ...headers }),
    json: async () => body,
  };
}

/** Standard non-2xx JSON response. */
function errResponse(status: number, body: unknown) {
  return {
    ok: false,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  };
}

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  clearAllAuthCookies();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearAllAuthCookies();
  globalThis.fetch = ORIG_FETCH;
});

describe('admin auth recovery — refresh after token rotation', () => {
  it('recovers from a 401 via the refresh cookie and retries with the NEW cookie token', async () => {
    // Pre-rotation cookie token
    setCookie('access_token', 'token-v1');

    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/refresh')) {
        // The backend rotates tokens and sets the fresh cookie itself; the
        // client-side observable effect is the cookie jar after this call.
        setCookie('access_token', 'token-v2');
        return okResponse({ success: true });
      }
      if (String(url).includes('/admin/settings')) {
        return errResponse(401, { message: 'Unauthorized' });
      }
      return okResponse({ success: true, data: [] });
    });

    const res = await base.apiFetch('/api/v1/admin/settings');

    expect(res.success).toBe(false); // the 401 response itself is final here…
    // …but the retry must have happened, carrying the ROTATED token.
    const settingsCalls = callsTo('/admin/settings');
    expect(settingsCalls).toHaveLength(2);
    // Retry carries the ROTATED token, not the pre-rotation one.
    const authHeaders = settingsCalls.map((c) => c.headers['Authorization']);
    expect(authHeaders).toEqual(['Bearer token-v1', 'Bearer token-v2']);
    // Exactly one refresh call — not one per request.
    expect(callsTo('/auth/refresh')).toHaveLength(1);
  });

  it('clears the session when the refresh itself fails (no recovery loop)', async () => {
    setCookie('access_token', 'token-v1');
    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/refresh')) {
        return errResponse(401, { message: 'refresh token invalid' });
      }
      return errResponse(401, { message: 'Unauthorized' });
    });

    const cookieSpy = vi.spyOn(document, 'cookie', 'get');
    const res = await base.apiFetch('/api/v1/admin/settings');

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.message).toContain('Session expired');
    // No retry of the original request when refresh failed.
    expect(callsTo('/admin/settings')).toHaveLength(1);
    cookieSpy.mockRestore();
  });
});

describe('admin auth recovery — stale Authorization header', () => {
  it('mirrors the Authorization header from the cookie only, never from localStorage', async () => {
    localStorage.setItem('azeebo_admin_user_token', 'stale-ls-token');
    // No cookie token at all.
    const base = await freshBase();

    fetchMock.mockResolvedValue(okResponse({ success: true, data: [] }));

    await base.apiFetch('/api/v1/admin/settings');

    const [, init] = (fetchMock.mock.calls[0] ?? []) as [string, RequestInit | undefined];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    // The stale localStorage token must NOT be attached — that is the exact
    // bug that 401'd every request after the first refresh.
    expect(headers['Authorization']).toBeUndefined();
  });

  it('after refresh, the retry replaces a stale header with the fresh cookie token', async () => {
    // Pre-rotation: both cookie and localStorage hold v1.
    setCookie('access_token', 'token-v1');
    localStorage.setItem('azeebo_admin_user_token', 'token-v1');
    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/refresh')) {
        setCookie('access_token', 'token-v2');
        return okResponse({ success: true });
      }
      return errResponse(401, { message: 'Unauthorized' });
    });

    await base.apiFetch('/api/v1/admin/settings');

    const settingsCalls = callsTo('/admin/settings');
    expect(settingsCalls).toHaveLength(2);
    const authHeaders = settingsCalls.map((c) => c.headers['Authorization']);
    expect(authHeaders[0]).toBe('Bearer token-v1');
    // Retry uses the rotated cookie token — never the (equal-or-stale) one
    // captured before the refresh.
    expect(authHeaders[1]).toBe('Bearer token-v2');
  });
});

describe('admin auth recovery — CSRF 403 after gateway restart', () => {
  it('re-bootstraps once and retries the mutation with the fresh token', async () => {
    // Client holds a token minted by the previous gateway process.
    setCookie('_csrf', 'csrf-old');
    const base = await freshBase();

    let csrfBootstraps = 0;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/auth/csrf')) {
        csrfBootstraps += 1;
        return okResponse({ success: true }, { 'X-CSRF-Token': 'csrf-new' });
      }
      // First attempt carries the stale token and is rejected with the
      // CSRF-flavored 403 the gateway sends when its in-memory secret no
      // longer matches; the retry (fresh token) succeeds.
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (headers['X-CSRF-Token'] === 'csrf-old') {
        return errResponse(403, {
          error: 'CSRF token missing',
          message: 'X-CSRF-Token header and _csrf cookie are required for this request',
        });
      }
      return okResponse({ success: true, data: { ok: true } });
    });

    const res = await base.apiFetch('/api/v1/admin/settings/maintenance_mode', {
      method: 'PUT',
      body: JSON.stringify({ value: true }),
    });

    // The mutation was retried…
    expect(callsTo('/admin/settings/maintenance_mode')).toHaveLength(2);
    const putCalls = callsTo('/admin/settings/maintenance_mode');
    expect(putCalls).toHaveLength(2);
    const csrfHeaders = putCalls.map((c) => c.headers['X-CSRF-Token']);
    expect(csrfHeaders[0]).toBe('csrf-old');
    expect(csrfHeaders[1]).toBe('csrf-new');
    // …after exactly one re-bootstrap, not a loop.
    expect(csrfBootstraps).toBe(1);
    // The retry succeeded, so the caller sees success.
    expect(res.success).toBe(true);
  });

  it('returns the failure when the retried mutation still fails (no recovery loop)', async () => {
    setCookie('_csrf', 'csrf-old');
    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/auth/csrf')) {
        return okResponse({ success: true }, { 'X-CSRF-Token': 'csrf-new' });
      }
      // Stale-token attempt: CSRF 403 (gateway restart). Retry with the
      // fresh token gets past CSRF but hits a genuine validation failure.
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (headers['X-CSRF-Token'] === 'csrf-old') {
        return errResponse(403, {
          error: 'CSRF token missing',
          message: 'X-CSRF-Token header and _csrf cookie are required for this request',
        });
      }
      return errResponse(400, { message: 'value must be an object' });
    });

    const res = await base.apiFetch('/api/v1/admin/settings/maintenance_mode', {
      method: 'PUT',
      body: JSON.stringify({ value: true }),
    });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.message).toBe('value must be an object');
    // No second retry after the recovery attempt failed.
    expect(callsTo('/admin/settings/maintenance_mode')).toHaveLength(2);
  });

  it('bootstraps a CSRF token before the first mutation when none is cached', async () => {
    // Cold page: no _csrf cookie at all.
    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/csrf')) {
        return okResponse({ success: true }, { 'X-CSRF-Token': 'csrf-fresh' });
      }
      return okResponse({ success: true, data: { ok: true } });
    });

    await base.apiFetch('/api/v1/admin/settings/maintenance_mode', {
      method: 'PUT',
      body: JSON.stringify({ value: false }),
    });

    const putCalls = callsTo('/admin/settings/maintenance_mode');
    expect(putCalls).toHaveLength(1);
    expect(putCalls.map((c) => c.headers['X-CSRF-Token'])[0]).toBe('csrf-fresh');
  });

  it('does not trigger CSRF recovery for non-CSRF 403s (authorization failures)', async () => {
    setCookie('_csrf', 'csrf-old');
    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/csrf')) {
        return okResponse({ success: true }, { 'X-CSRF-Token': 'csrf-new' });
      }
      // RBAC denial — message must NOT smell like CSRF.
      return errResponse(403, { message: 'Forbidden: requires SUPERADMIN role' });
    });

    await base.apiFetch('/api/v1/admin/settings/maintenance_mode', {
      method: 'PUT',
      body: JSON.stringify({ value: true }),
    });

    // One request only — no bootstrap, no retry.
    expect(callsTo('/admin/settings/maintenance_mode')).toHaveLength(1);
    expect(callsTo('/auth/csrf')).toHaveLength(0);
  });
});

describe('admin auth recovery — parallel request behavior', () => {
  it('shares ONE refresh across parallel 401s (single-flight rotation)', async () => {
    setCookie('access_token', 'token-v1');
    const base = await freshBase();

    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/refresh')) {
        setCookie('access_token', 'token-v2');
        return okResponse({ success: true });
      }
      return errResponse(401, { message: 'Unauthorized' });
    });

    // Five concurrent requests that all 401 — they must share one rotation.
    await Promise.all([
      base.apiFetch('/api/v1/admin/settings'),
      base.apiFetch('/api/v1/admin/universes'),
      base.apiFetch('/api/v1/admin/users?page=1'),
      base.apiFetch('/api/v1/admin/wallets'),
      base.apiFetch('/api/v1/admin/feature-flags'),
    ]);

    expect(callsTo('/auth/refresh')).toHaveLength(1);
  });

  it('shares ONE CSRF re-bootstrap across parallel CSRF 403s (single-flight recovery)', async () => {
    setCookie('_csrf', 'csrf-old');
    const base = await freshBase();

    let csrfBootstraps = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/auth/csrf')) {
        csrfBootstraps += 1;
        return okResponse({ success: true }, { 'X-CSRF-Token': 'csrf-new' });
      }
      return errResponse(403, {
        error: 'CSRF token missing',
        message: 'X-CSRF-Token header and _csrf cookie are required for this request',
      });
    });

    await Promise.all([
      base.apiFetch('/api/v1/admin/settings/a', { method: 'PUT', body: '{}' }),
      base.apiFetch('/api/v1/admin/settings/b', { method: 'PUT', body: '{}' }),
      base.apiFetch('/api/v1/admin/settings/c', { method: 'PUT', body: '{}' }),
    ]);

    expect(csrfBootstraps).toBe(1);
  });
});

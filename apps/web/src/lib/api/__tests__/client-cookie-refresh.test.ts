/**
 * ApiClient 401 recovery without a JS-readable refresh token.
 *
 * The refresh token lives only in an httpOnly cookie, so `localStorage` can
 * never supply one. The client must therefore rotate through the cookie with a
 * bodyless POST instead of giving up — giving up used to make every ApiClient
 * 401 hard-redirect a still-valid user to the login page.
 *
 * Run: npx vitest run src/lib/api/__tests__/client-cookie-refresh.test.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface RecordedCall {
  url: string;
  method: string;
  body?: unknown;
  credentials?: string;
}

function res(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

const PROFILE = {
  success: true,
  data: { id: 'u-1', email: 'k@azeebo.com', name: 'K', role: 'user' },
};

/**
 * `/auth/refresh` is called through the same client, so the mock must not let
 * that call itself trip the recovery path — hence the in-flight guard.
 */
function createBackend() {
  const calls: RecordedCall[] = [];
  let accessIssued = false;

  const handler = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const urlStr = String(url);
    calls.push({
      url: urlStr,
      method: (init?.method ?? 'GET').toUpperCase(),
      body: init?.body,
      credentials: init?.credentials,
    });

    if (urlStr === '/api/v1/users/me') {
      return accessIssued ? res(200, PROFILE) : res(401, { message: 'Unauthorized' });
    }
    if (urlStr === '/api/v1/auth/refresh') {
      accessIssued = true;
      return res(200, { success: true, data: { access_token: 'a2', refresh_token: 'r2' } });
    }
    return res(200, { success: true });
  });

  return { calls, handler };
}

describe('ApiClient cookie-only token rotation', () => {
  let api: typeof import('../index').api;
  let backend: ReturnType<typeof createBackend>;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    backend = createBackend();
    vi.stubGlobal('fetch', backend.handler);
    api = (await import('../index')).api;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rotates through the refresh cookie and replays the request', async () => {
    api.setToken(null);

    const result = await api.user.getProfile();

    expect(result.success).toBe(true);
    const calls = backend.calls;
    const refresh = calls.find((c) => c.url === '/api/v1/auth/refresh');
    expect(refresh?.method).toBe('POST');
    // No body: the browser's httpOnly cookie is the only token store.
    expect(refresh?.body).toBeUndefined();
    expect(refresh?.credentials).toBe('include');
    // the original request ran again after the rotation
    expect(calls.filter((c) => c.url === '/api/v1/users/me')).toHaveLength(2);
  });

  it('shares one rotation across parallel 401s', async () => {
    api.setToken(null);

    const [a, b] = await Promise.all([api.user.getProfile(), api.user.getProfile()]);

    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(backend.calls.filter((c) => c.url === '/api/v1/auth/refresh')).toHaveLength(1);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

/**
 * The callback route is the only place a provider's response becomes a session,
 * so every branch here is security-relevant: an unmapped failure shows a user
 * raw JSON, and a missed allowlist check is an open redirect.
 */

function upstream(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const OK_BODY = {
  success: true,
  data: {
    user: { id: 'u-1', email: 'a@example.com', displayName: 'A', role: 'user' },
    // Three-part JWT whose payload decodes to {"sub":"u-1"}, so the
    // middleware marker carries the user id rather than the sentinel.
    access_token: 'aaa.eyJzdWIiOiAidS0xIn0.ccc',
    refresh_token: 'ddd.eee.fff',
  },
};

function get(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:4000'));
}

function locationOf(res: Response): string {
  return res.headers.get('location') ?? '';
}

describe('OAuth callback route', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_PANEL_ORIGINS = 'https://admin.azeebo.com';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('failures return to the login page, never raw JSON', () => {
    it('maps a cancelled consent to the login page', async () => {
      const res = await GET(get('/auth/callback?error=access_denied'));
      expect(res.status).toBe(303);
      expect(locationOf(res)).toContain('/auth/login?error=cancelled');
    });

    it('maps an Apple cancel keyword too', async () => {
      const res = await GET(get('/auth/callback?error=user_cancelled_authorize'));
      expect(locationOf(res)).toContain('error=cancelled');
    });

    it('rejects a callback with no code or state', async () => {
      const res = await GET(get('/auth/callback?code=only-code'));
      expect(locationOf(res)).toContain('error=state_invalid');
    });

    it('maps a 400 from the service to state_invalid', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(400, {})));
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toContain('error=state_invalid');
    });

    it('maps a 409 to account_conflict', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(409, {})));
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toContain('error=account_conflict');
    });

    it('maps a 503 (kill switch / unconfigured) to unavailable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(503, {})));
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toContain('error=unavailable');
    });

    it('maps a network failure to unavailable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toContain('error=unavailable');
    });

    it('maps a success payload with no token to exchange_failed', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(200, { success: true, data: {} })));
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toContain('error=exchange_failed');
    });
  });

  describe('success establishes the cookie session', () => {
    it('sets the httpOnly jar and redirects home', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(200, OK_BODY)));

      const res = await GET(get('/auth/callback?code=c&state=s'));

      expect(res.status).toBe(303);
      expect(locationOf(res)).toBe('http://localhost:4000/home');

      const cookies = res.headers.getSetCookie?.() ?? [];
      const joined = cookies.join('\n');
      expect(joined).toContain('access_token=aaa.eyJzdWIiOiAidS0xIn0.ccc');
      expect(joined).toContain('refresh_token=ddd.eee.fff');
      expect(joined).toContain('azeebo_web_auth=u-1');
      expect(joined).toContain('HttpOnly');
    });

    it('uses SameSite=Lax so the cross-site redirect keeps the session', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(200, OK_BODY)));
      const res = await GET(get('/auth/callback?code=c&state=s'));
      const joined = (res.headers.getSetCookie?.() ?? []).join('\n');
      expect(joined).toContain('SameSite=lax');
      expect(joined).not.toContain('SameSite=strict');
    });
  });

  describe('return target is allowlisted', () => {
    it('honours a same-origin path from the state record', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(upstream(200, { ...OK_BODY, redirect: '/wallet' }))
      );
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toBe('http://localhost:4000/wallet');
    });

    it('honours an allowlisted panel origin', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(upstream(200, { ...OK_BODY, redirect: 'https://admin.azeebo.com/x' }))
      );
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toBe('https://admin.azeebo.com/x');
    });

    it('falls back to /home for a protocol-relative target', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(upstream(200, { ...OK_BODY, redirect: '//evil.example/x' }))
      );
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toBe('http://localhost:4000/home');
    });

    it('falls back to /home for a lookalike panel origin', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            upstream(200, { ...OK_BODY, redirect: 'https://admin.azeebo.com.evil.example/x' })
          )
      );
      const res = await GET(get('/auth/callback?code=c&state=s'));
      expect(locationOf(res)).toBe('http://localhost:4000/home');
    });
  });

  describe('Apple form_post', () => {
    it('accepts the POST shape a GET-only page route could not receive', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(200, OK_BODY)));

      const form = new FormData();
      form.set('code', 'apple-code');
      form.set('state', 'apple-state');
      const req = new NextRequest(new URL('http://localhost:4000/auth/callback'), {
        method: 'POST',
        body: form,
      });
      (req as any).formData = async () => form;

      const res = await POST(req);

      expect(res.status).toBe(303);
      expect(locationOf(res)).toBe('http://localhost:4000/home');
      expect((res.headers.getSetCookie?.() ?? []).join('\n')).toContain(
        'access_token=aaa.eyJzdWIiOiAidS0xIn0.ccc'
      );
    });

    it('forwards the code and state to the service', async () => {
      const fetchMock = vi.fn().mockResolvedValue(upstream(200, OK_BODY));
      vi.stubGlobal('fetch', fetchMock);

      const form = new FormData();
      form.set('code', 'apple-code');
      form.set('state', 'apple-state');
      const req = new NextRequest(new URL('http://localhost:4000/auth/callback'), {
        method: 'POST',
        body: form,
      });
      (req as any).formData = async () => form;
      await POST(req);

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain('/api/v1/auth/social/callback');
      expect(JSON.parse(String(init.body))).toEqual({ code: 'apple-code', state: 'apple-state' });
    });

    it('maps an Apple error post to cancelled', async () => {
      const form = new FormData();
      form.set('error', 'user_cancelled_authorize');
      const req = new NextRequest(new URL('http://localhost:4000/auth/callback'), {
        method: 'POST',
        body: form,
      });
      (req as any).formData = async () => form;
      const res = await POST(req);
      expect(locationOf(res)).toContain('error=cancelled');
    });
  });
});

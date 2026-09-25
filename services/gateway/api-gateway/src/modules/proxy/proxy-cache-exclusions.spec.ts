import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ProxyController } from './proxy.controller.js';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service.js';
import { AuthThrottlerGuard } from '../../guards/auth-throttler.guard.js';
import { AdminGuard } from '@azeebo/security';
import { FeatureFlagService, gatewayFlags } from '@azeebo/feature-flags';

/**
 * Response-cache exclusion tests.
 *
 * The gateway caches proxied GETs for 5 minutes. When the admin panel mutates
 * intelligence or subscription data and immediately re-fetches the list, a
 * cached GET served pre-mutation bytes and every mutation appeared to
 * silently revert. /admin/* was excluded for exactly this reason; /analytics/*
 * and /subscription/bundles were added after the same bug was reproduced live
 * (agent register → list stayed at 0; bundle delete → card stayed visible).
 *
 * These tests pin the contract at the behavior level — through the real
 * proxyRequest pipeline — for both directions:
 *   1. never SERVED from cache: a pre-seeded cached body must be ignored;
 *   2. never WRITTEN to cache: an upstream miss must not populate the cache,
 *      even with the responseCache flag on and a healthy 200 upstream.
 */
class MockAuthThrottlerGuard implements CanActivate {
  async canActivate(_context: ExecutionContext): Promise<boolean> {
    return true;
  }
}

class MockAdminGuard implements CanActivate {
  async canActivate(_context: ExecutionContext): Promise<boolean> {
    return true;
  }
}

jest.mock('@azeebo/shared-types', () => ({
  CircuitBreaker: class {
    execute = jest.fn();
    getStats = jest.fn();
  },
  CircuitBreakerOpenError: class extends Error {},
  ApiVersioningConfig: { parseVersion: (v: string) => v || '1' },
  API_VERSION_HEADER: 'x-api-version',
  DEFAULT_API_VERSION: '1',
}));

describe('ProxyController response-cache exclusions', () => {
  let controller: ProxyController;
  let flagService: { isEnabled: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock };
  let circuitBreaker: { proxyRequest: jest.Mock };

  const mockRes = () => {
    const res: Record<string, unknown> = { headersSent: false };
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as {
      status: jest.Mock;
      json: jest.Mock;
      setHeader: jest.Mock;
      send: jest.Mock;
      headersSent: boolean;
    };
  };

  const mockReq = (path: string, overrides: Record<string, unknown> = {}) =>
    ({
      headers: {},
      url: `/api/v1/${path}`,
      path: `/${path}`,
      params: { service: path.split('/')[0], path: path.split('/').slice(1).join('/') },
      method: 'GET',
      body: undefined,
      ...overrides,
    }) as unknown as Request;

  beforeEach(async () => {
    flagService = { isEnabled: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn() };
    circuitBreaker = {
      proxyRequest: jest.fn().mockResolvedValue({
        status: 200,
        data: { success: true, data: [] },
        headers: {},
        circuitState: 'CLOSED',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: CircuitBreakerProxyService, useValue: circuitBreaker },
        { provide: FeatureFlagService, useValue: flagService },
      ],
    })
      .overrideGuard(AuthThrottlerGuard)
      .useClass(MockAuthThrottlerGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .compile();

    controller = module.get<ProxyController>(ProxyController);

    // All flags on, nothing special: maintenance off, everything else enabled.
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key !== gatewayFlags.maintenanceMode)
    );
  });

  describe('never served from cache', () => {
    const excludedPaths = [
      'analytics/agents',
      'analytics/tasks',
      'analytics/capacity',
      'analytics/risk',
      'analytics/reports',
      'analytics/kpis',
      'analytics/search/corrections',
      'subscription/bundles',
    ];

    it.each(excludedPaths)('GET /%s bypasses a pre-seeded cache entry', async (path) => {
      const cachedBody = { success: true, data: [{ id: 'stale' }], stale: true };
      cache.get.mockResolvedValue(cachedBody);

      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet(path.split('/')[0], mockReq(path), res);

      // The stale cached body can never reach the client: upstream is
      // consulted and the live response is what gets delivered. (The
      // implementation skips the cache lookup entirely on excluded paths, so
      // cache.get may legitimately never fire here — assert the outcome,
      // not the lookup mechanics.)
      expect(circuitBreaker.proxyRequest).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(res.json).not.toHaveBeenCalledWith(cachedBody);
    });

    it('GET /admin/dashboard/stats keeps bypassing the cache (original exclusion)', async () => {
      const cachedBody = { success: true, data: { stale: true } };
      cache.get.mockResolvedValue(cachedBody);

      const res = mockRes();
      await (
        controller as unknown as {
          proxyVersionedGet: (v: string, s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyVersionedGet(
        'v1',
        'admin',
        mockReq('admin/dashboard/stats', { user: { role: 'admin' } }),
        res
      );

      expect(circuitBreaker.proxyRequest).toHaveBeenCalledTimes(1);
      expect(res.json).not.toHaveBeenCalledWith(cachedBody);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  describe('never written to cache', () => {
    const excludedPaths = [
      'analytics/agents',
      'analytics/tasks',
      'analytics/capacity',
      'analytics/risk',
      'analytics/reports',
      'analytics/kpis',
      'analytics/search/corrections',
      'subscription/bundles',
    ];

    it.each(excludedPaths)('GET /%s does not populate the cache on upstream 200', async (path) => {
      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet(path.split('/')[0], mockReq(path), res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('GET /admin/dashboard/stats does not populate the cache (original exclusion)', async () => {
      const res = mockRes();
      await (
        controller as unknown as {
          proxyVersionedGet: (v: string, s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyVersionedGet('v1', 'admin', mockReq('admin/dashboard/stats'), res);

      expect(cache.set).not.toHaveBeenCalled();
    });

    it('non-marked public-ish route is deny-by-default (no implicit caching)', async () => {
      // The cache only serves routes that explicitly opted in — /content has
      // no publicCacheable flag, so an anonymous GET is neither read from nor
      // written to the cache even though it is not admin/analytics scoped.
      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet('content', mockReq('content/home'), res);

      expect(cache.set).not.toHaveBeenCalled();
      expect(cache.get).not.toHaveBeenCalled();
    });
  });

  describe('cache partitioning', () => {
    it('analytics paths are excluded for every user partition, not just the default key', async () => {
      // The exclusion check runs on the path before partitioning matters, so
      // a Bearer-authenticated request must behave identically.
      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet(
        'analytics',
        mockReq('analytics/tasks', {
          headers: { authorization: 'Bearer test-token' },
        }),
        res
      );

      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('deny-by-default cache policy (allowlist + auth gate)', () => {
    /**
     * The cache is deny-by-default: a GET is eligible only when the route
     * explicitly sets publicCacheable AND the caller carries no credentials.
     * Every credential form — Bearer header, session cookie, gateway-stamped
     * req.user — must disable both cache directions, because a shared cached
     * body could otherwise serve one user another user's data, and
     * authenticated reads re-issue right after mutations.
     */
    it.each([
      ['Bearer header', { authorization: 'Bearer test-token' }],
      ['session cookie', { cookie: 'access_token=abc123' }],
    ])('authenticated GET /content/home never touches the cache (%s)', async (_label, headers) => {
      cache.get.mockResolvedValue({ success: true, data: [{ stale: true }] });

      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet('content', mockReq('content/home', { headers }), res);

      // Never served from cache (live upstream body wins) and never written.
      expect(circuitBreaker.proxyRequest).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('gateway-stamped req.user disables the cache even without headers', async () => {
      cache.get.mockResolvedValue({ success: true, data: [{ stale: true }] });

      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet('content', mockReq('content/home', { user: { id: 'u-1', role: 'user' } }), res);

      expect(circuitBreaker.proxyRequest).toHaveBeenCalledTimes(1);
      expect(res.json).not.toHaveBeenCalledWith({ success: true, data: [{ stale: true }] });
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('explicitly public route + anonymous caller reads and writes the cache (positive control)', async () => {
      // First call: cache miss → upstream consulted → response cached.
      const res1 = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet('pricing', mockReq('pricing/vote-packages/basic'), res1);

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('proxy:GET:/api/v1/pricing/vote-packages/basic'),
        { success: true, data: [] },
        expect.any(Number)
      );

      // Second call: served from cache, upstream untouched.
      circuitBreaker.proxyRequest.mockClear();
      cache.get.mockResolvedValue({ success: true, data: [{ id: 'pkg-basic', cached: true }] });
      const res2 = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet('pricing', mockReq('pricing/vote-packages/basic'), res2);

      expect(circuitBreaker.proxyRequest).not.toHaveBeenCalled();
      expect(res2.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'pkg-basic', cached: true }],
      });
    });

    it('explicitly public route + authenticated caller bypasses both cache directions', async () => {
      cache.get.mockResolvedValue({ success: true, data: [{ stale: true }] });

      const res = mockRes();
      await (
        controller as unknown as {
          proxyGet: (s: string, r: Request, res: unknown) => Promise<void>;
        }
      ).proxyGet(
        'pricing',
        mockReq('pricing/vote-packages/basic', { headers: { cookie: 'access_token=abc123' } }),
        res
      );

      expect(circuitBreaker.proxyRequest).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(cache.set).not.toHaveBeenCalled();
    });
  });
});

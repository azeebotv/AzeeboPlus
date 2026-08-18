import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ProxyController } from './proxy.controller.js';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service.js';
import { AuthThrottlerGuard } from '../../guards/auth-throttler.guard.js';
import { AdminGuard } from '@azeebo/security';
import { FeatureFlagService, gatewayFlags } from '@azeebo/feature-flags';

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

describe('ProxyController routing gates', () => {
  let controller: ProxyController;
  let flagService: { isEnabled: jest.Mock };

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

  const mockReq = (overrides: Record<string, unknown> = {}) =>
    ({
      headers: {},
      url: '/api/v1/vertical',
      params: { service: 'vertical', path: '' },
      method: 'GET',
      body: undefined,
      ...overrides,
    }) as unknown as Request;

  beforeEach(async () => {
    flagService = { isEnabled: jest.fn().mockResolvedValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: CircuitBreakerProxyService,
          useValue: { proxyRequest: jest.fn() },
        },
        { provide: FeatureFlagService, useValue: flagService },
      ],
    })
      .overrideGuard(AuthThrottlerGuard)
      .useClass(MockAuthThrottlerGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .compile();

    controller = module.get<ProxyController>(ProxyController);
  });

  it('returns 404 for new routes when gateway_new_routes is off', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === gatewayFlags.responseCache || key === gatewayFlags.circuitBreaker)
    );
    const res = mockRes();

    await (
      controller as unknown as { proxyGet: (s: string, r: Request, res: unknown) => Promise<void> }
    ).proxyGet('vertical', mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Service not found' })
    );
  });

  it('proxies new routes when gateway_new_routes is on', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key !== gatewayFlags.maintenanceMode)
    );
    const res = mockRes();
    const circuitBreaker = (
      controller as unknown as {
        circuitBreakerProxyService: { proxyRequest: jest.Mock };
      }
    ).circuitBreakerProxyService;
    circuitBreaker.proxyRequest.mockResolvedValue({
      status: 200,
      data: { ok: true },
      headers: {},
      circuitState: 'CLOSED',
    });

    await (
      controller as unknown as { proxyGet: (s: string, r: Request, res: unknown) => Promise<void> }
    ).proxyGet('vertical', mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(circuitBreaker.proxyRequest).toHaveBeenCalled();
    // Regression: a refactor cached GET JSON responses but never wrote them to
    // the client — the first GET to any endpoint returned an empty body. The
    // proxied body must be delivered (and cached) on cache miss.
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('delivers GET JSON bodies even when response caching is disabled', async () => {
    flagService.isEnabled.mockImplementation(
      (key: string) => Promise.resolve(key === gatewayFlags.circuitBreaker) // responseCache OFF
    );
    const res = mockRes();
    const circuitBreaker = (
      controller as unknown as {
        circuitBreakerProxyService: { proxyRequest: jest.Mock };
      }
    ).circuitBreakerProxyService;
    circuitBreaker.proxyRequest.mockResolvedValue({
      status: 200,
      data: { ok: true, uncached: true },
      headers: {},
      circuitState: 'CLOSED',
    });

    await (
      controller as unknown as { proxyGet: (s: string, r: Request, res: unknown) => Promise<void> }
    ).proxyGet('content', mockReq({ params: { service: 'content', path: 'home' } }), res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, uncached: true });
    expect(circuitBreaker.proxyRequest).toHaveBeenCalled();
  });

  it('returns 503 during maintenance mode before any forwarding', async () => {
    flagService.isEnabled.mockResolvedValue(true); // maintenance on, everything on
    const res = mockRes();
    const circuitBreaker = (
      controller as unknown as {
        circuitBreakerProxyService: { proxyRequest: jest.Mock };
      }
    ).circuitBreakerProxyService;

    await (
      controller as unknown as { proxyGet: (s: string, r: Request, res: unknown) => Promise<void> }
    ).proxyGet('auth', mockReq({ params: { service: 'auth', path: '' } }), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Platform is under maintenance. Please try again later.' })
    );
    expect(circuitBreaker.proxyRequest).not.toHaveBeenCalled();
  });

  it('forwards POST /admin/universes/feature-flags/restore to the admin service', async () => {
    const res = mockRes();
    const circuitBreaker = (
      controller as unknown as {
        circuitBreakerProxyService: { proxyRequest: jest.Mock };
      }
    ).circuitBreakerProxyService;
    circuitBreaker.proxyRequest.mockResolvedValue({
      status: 200,
      data: { restoredCount: 1 },
      headers: {},
      circuitState: 'CLOSED',
    });
    const body = { keys: [{ universeId: 'u-1', featureKey: 'voting_enabled' }] };

    await (
      controller as unknown as {
        proxyVersionedPost: (v: string, s: string, r: Request, res: unknown) => Promise<void>;
      }
    ).proxyVersionedPost(
      'v1',
      'admin',
      mockReq({
        url: '/api/v1/admin/universes/feature-flags/restore',
        params: { version: 'v1', service: 'admin', path: 'universes/feature-flags/restore' },
        method: 'POST',
        body,
        user: { role: 'superadmin' },
      }),
      res
    );

    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        // no-prefix strategy builds /admin + the wildcard path; the ^/v1
        // rewrite only strips a version prefix, which isn't in the target.
        path: '/admin/universes/feature-flags/restore',
        targetUrl: 'http://localhost:4016',
        body,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ restoredCount: 1 });
  });

  it('rejects POST /admin/universes/feature-flags/restore without an admin role (gateway-side fail-closed)', async () => {
    const res = mockRes();
    const circuitBreaker = (
      controller as unknown as {
        circuitBreakerProxyService: { proxyRequest: jest.Mock };
      }
    ).circuitBreakerProxyService;

    await (
      controller as unknown as {
        proxyVersionedPost: (v: string, s: string, r: Request, res: unknown) => Promise<void>;
      }
    ).proxyVersionedPost(
      'v1',
      'admin',
      mockReq({
        url: '/api/v1/admin/universes/feature-flags/restore',
        params: { version: 'v1', service: 'admin', path: 'universes/feature-flags/restore' },
        method: 'POST',
        body: { keys: [{ universeId: 'u-1', featureKey: 'voting_enabled' }] },
        // No user on the request: the proxy's own admin gate must deny BEFORE
        // any upstream communication, even with AdminGuard bypassed.
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
    expect(circuitBreaker.proxyRequest).not.toHaveBeenCalled();
  });

  it('rejects API v2 requests when gateway_api_v2 is off', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key !== gatewayFlags.maintenanceMode && key !== gatewayFlags.apiV2)
    );
    const res = mockRes();

    // Version comes straight from the URL param on the versioned routes
    // (/api/:version/:service), bypassing the header fallback.
    await (
      controller as unknown as {
        proxyVersionedRootGet: (v: string, s: string, r: Request, res: unknown) => Promise<void>;
      }
    ).proxyVersionedRootGet('v2', 'auth', mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'API version v2 is not enabled' })
    );
  });
});

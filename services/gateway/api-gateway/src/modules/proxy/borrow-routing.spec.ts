import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProxyController, SERVICE_CONFIGS } from './proxy.controller.js';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service.js';
import { AuthThrottlerGuard } from '../../guards/auth-throttler.guard.js';
import { AdminGuard } from '@azeebo/security';
import { FeatureFlagService, gatewayFlags } from '@azeebo/feature-flags';
import { GatewayAuthGuard } from '../../guards/gateway-auth.guard.js';

/**
 * Borrow routing contract.
 *
 * The public Borrow page is served to anonymous visitors, so two gateway
 * invariants have to hold at once: /borrow/banks* stays reachable without a
 * token, and /borrow/admin/* never is. A regression in either direction is
 * invisible locally (the admin panel always sends cookies, the web page always
 * has one after login), so both are pinned here at behavior level.
 */
class MockAuthThrottlerGuard {
  async canActivate(): Promise<boolean> {
    return true;
  }
}

class MockAdminGuard {
  async canActivate(): Promise<boolean> {
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

const borrowRoute = SERVICE_CONFIGS.find((route) => route.path === '/borrow');

describe('Borrow route configuration', () => {
  it('routes /borrow to the wallet service', () => {
    expect(borrowRoute).toBeDefined();
    expect(borrowRoute?.envKey).toBe('WALLET_SERVICE_URL');
    expect(borrowRoute?.pathStrategy).toBe('default');
  });

  it('is not parked behind gateway_new_routes', () => {
    // Deliberate: a page that ships to anonymous visitors cannot depend on an
    // ops flag being flipped first.
    expect(borrowRoute?.isNew).toBeUndefined();
  });

  it('declares exactly the endpoints the page and admin screen use', () => {
    const declared = borrowRoute?.endpoints?.map((ep) => `${ep.method} ${ep.path}`).sort() ?? [];
    expect(declared).toEqual(
      [
        'DELETE /admin/banks/:id',
        'GET /admin/banks',
        'GET /banks',
        'GET /banks/:slug',
        'PATCH /admin/banks/:id',
        'POST /admin/banks',
      ].sort()
    );
  });

  it('keeps the approved-lender catalogue out of the shared response cache', () => {
    // The cache has no write-side invalidation and holds a body for CACHE_TTL_MS,
    // which would keep advertising a lender an admin just pulled or deactivated.
    expect(borrowRoute?.publicCacheable).toBeFalsy();
  });
});

describe('GatewayAuthGuard on /borrow', () => {
  const guardPath = (path: string, method = 'GET', headers: Record<string, string> = {}) => {
    const request = { path, url: path, method, headers };
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { request, context };
  };

  const makeGuard = () =>
    new GatewayAuthGuard(
      { getAllAndOverride: () => false } as unknown as Reflector,
      { get: () => undefined } as unknown as ConfigService
    );

  it.each(['/api/v1/borrow/banks', '/api/v1/borrow/banks/sample-bank-a'])(
    'lets an anonymous GET through: %s',
    async (path) => {
      const { context } = guardPath(path);
      await expect(makeGuard().canActivate(context)).resolves.toBe(true);
    }
  );

  it('gates a write to the public path even though the path matches', async () => {
    const { context } = guardPath('/api/v1/borrow/banks', 'POST');
    await expect(makeGuard().canActivate(context)).rejects.toThrow();
  });

  it('gates the admin list for an anonymous caller', async () => {
    const { context } = guardPath('/api/v1/borrow/admin/banks');
    await expect(makeGuard().canActivate(context)).rejects.toThrow();
  });

  it('gates admin writes too', async () => {
    const { context } = guardPath('/api/v1/borrow/admin/banks', 'POST');
    await expect(makeGuard().canActivate(context)).rejects.toThrow();
  });

  it('strips client-supplied identity headers before routing', async () => {
    const { request, context } = guardPath('/api/v1/borrow/banks', 'GET', {
      'x-user-id': 'spoofed',
      'x-user-role': 'admin',
      'x-gateway-secret': 'spoofed-secret',
    });
    await expect(makeGuard().canActivate(context)).resolves.toBe(true);
    expect(request.headers).not.toHaveProperty('x-user-id');
    expect(request.headers).not.toHaveProperty('x-user-role');
    expect(request.headers).not.toHaveProperty('x-gateway-secret');
  });
});

describe('ProxyController forwards /borrow', () => {
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
    res.append = jest.fn().mockReturnValue(res);
    return res as unknown as {
      status: jest.Mock;
      json: jest.Mock;
      setHeader: jest.Mock;
      set: jest.Mock;
      append: jest.Mock;
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

  const call = (method: 'proxyGet' | 'proxyPost' | 'proxyPatch' | 'proxyDelete', path: string, res: unknown, req: Request) =>
    (controller as unknown as Record<string, (s: string, r: Request, x: unknown) => Promise<void>>)[
      method
    ](path.split('/')[0], req, res);

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

    // Endpoint enforcement ON: an undeclared /borrow path must 404 rather than
    // reach wallet-service. Response cache OFF so forwarding is observable
    // without cache reads.
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === gatewayFlags.endpointEnforcement)
    );
  });

  it('rewrites GET /borrow/banks onto the wallet service prefix', async () => {
    const res = mockRes();
    await call('proxyGet', 'borrow/banks', res, mockReq('borrow/banks'));

    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: 'borrow',
        method: 'GET',
        targetUrl: 'http://wallet-service:3002',
        path: '/v1/borrow/banks',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('forwards a slug lookup', async () => {
    const res = mockRes();
    await call('proxyGet', 'borrow/banks/sample-bank-a', res, mockReq('borrow/banks/sample-bank-a'));

    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/v1/borrow/banks/sample-bank-a' })
    );
  });

  it('leaves the public catalogue uncached even with the gateway response cache on', async () => {
    // Without this, the route config is the only thing keeping a pulled lender off
    // the public page, and a future "just cache it" change would silently reintroduce
    // a stale body that no admin write can evict.
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === gatewayFlags.endpointEnforcement || key === gatewayFlags.responseCache)
    );

    const res = mockRes();
    await call('proxyGet', 'borrow/banks', res, mockReq('borrow/banks'));

    expect(cache.get).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/v1/borrow/banks' })
    );
  });

  it('forwards the admin list, and never caches admin traffic', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === gatewayFlags.endpointEnforcement || key === gatewayFlags.responseCache)
    );

    const res = mockRes();
    await call(
      'proxyGet',
      'borrow/admin/banks',
      res,
      mockReq('borrow/admin/banks', { headers: { cookie: 'access_token=abc' } })
    );

    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/v1/borrow/admin/banks' })
    );
    expect(cache.get).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('forwards admin writes', async () => {
    const createRes = mockRes();
    await call(
      'proxyPost',
      'borrow/admin/banks',
      createRes,
      mockReq('borrow/admin/banks', { method: 'POST', body: { slug: 'partner-a' } })
    );
    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/v1/borrow/admin/banks' })
    );

    const patchRes = mockRes();
    await call(
      'proxyPatch',
      'borrow/admin/banks/pb-1',
      patchRes,
      mockReq('borrow/admin/banks/pb-1', { method: 'PATCH', body: { isActive: false } })
    );
    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', path: '/v1/borrow/admin/banks/pb-1' })
    );

    const deleteRes = mockRes();
    await call(
      'proxyDelete',
      'borrow/admin/banks/pb-1',
      deleteRes,
      mockReq('borrow/admin/banks/pb-1', { method: 'DELETE' })
    );
    expect(circuitBreaker.proxyRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE', path: '/v1/borrow/admin/banks/pb-1' })
    );
  });

  it('404s an undeclared borrow endpoint instead of proxying it', async () => {
    const res = mockRes();
    await call('proxyGet', 'borrow/admin/secret', res, mockReq('borrow/admin/secret'));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(circuitBreaker.proxyRequest).not.toHaveBeenCalled();
  });

  it('404s an undeclared borrow method', async () => {
    const res = mockRes();
    await call(
      'proxyPost',
      'borrow/banks',
      res,
      mockReq('borrow/banks', { method: 'POST', body: {} })
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(circuitBreaker.proxyRequest).not.toHaveBeenCalled();
  });
});

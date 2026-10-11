jest.mock('@azeebo/shared-types', () => ({
  CircuitBreaker: class {
    execute = jest.fn();
    getStats = jest.fn();
  },
  CircuitBreakerOpenError: class extends Error {},
  ApiVersioningConfig: {},
  API_VERSION_HEADER: 'x-api-version',
  DEFAULT_API_VERSION: '1',
}));

jest.mock('@azeebo/security', () => {
  const Guard = class {
    canActivate() {
      return true;
    }
  };
  return {
    AdminGuard: Guard,
    RateLimitGuard: Guard,
    RateLimit: () => () => {},
  };
});

// Feature flags are integration-tested elsewhere; mock the package so this
// contract spec doesn't load the real package (and its @nestjs/common peer
// chain) into the jest module graph.
jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagService: class {},
  gatewayFlags: {
    maintenanceMode: 'gateway_maintenance_mode',
    newRoutes: 'gateway_new_routes',
    circuitBreaker: 'gateway_circuit_breaker',
    responseCache: 'gateway_response_cache',
    strictRateLimits: 'gateway_strict_rate_limits',
    csrfEnforce: 'gateway_csrf_enforce',
    legacyRedirect: 'gateway_legacy_redirect',
    apiV2: 'gateway_api_v2',
  },
}));

import { SERVICE_CONFIGS } from './proxy.controller';

describe('Proxy Controller - API Contract Verification', () => {
  const requiredServices = [
    'auth',
    'users',
    'wallet',
    'payments',
    'content',
    'media',
    'search',
    'notifications',
    'rewards',
    'analytics',
    'recommendation',
    'creators',
    'support',
    'moderation',
    'engagement',
    'messaging',
    'referrals',
    'subscription',
    'universe',
  ];

  it('should have all required services registered', () => {
    const registeredServices = SERVICE_CONFIGS.map((route) => route.path.slice(1));
    requiredServices.forEach((service) => {
      expect(registeredServices).toContain(service);
    });
  });

  it('should have correct env key or fallback URL configured', () => {
    SERVICE_CONFIGS.forEach((route) => {
      expect(route.envKey).toBeDefined();
      expect(route.fallbackUrl).toBeDefined();
      expect(route.fallbackUrl).toMatch(/^http/);
    });
  });

  it('should support API versioning', () => {
    SERVICE_CONFIGS.forEach((route) => {
      expect(route.supportedVersions).toBeDefined();
      expect(Array.isArray(route.supportedVersions)).toBe(true);
      expect(route.supportedVersions.length).toBeGreaterThan(0);
      expect(route.defaultVersion).toBeDefined();
      expect(route.supportedVersions).toContain(route.defaultVersion);
    });
  });

  it('should have endpoints defined for each service', () => {
    SERVICE_CONFIGS.forEach((route) => {
      expect(route.endpoints).toBeDefined();
      expect(Array.isArray(route.endpoints)).toBe(true);
      expect(route.endpoints?.length).toBeGreaterThan(0);
    });
  });

  it('should have correct HTTP methods for auth endpoints', () => {
    const authRoute = SERVICE_CONFIGS.find((r) => r.path === '/auth');
    const methods = authRoute?.endpoints?.map((e) => e.method) || [];
    expect(methods).toContain('POST');
    expect(methods).toContain('GET');
    expect(methods).toContain('DELETE');
  });

  it('should have user-specific endpoints in users service', () => {
    const usersRoute = SERVICE_CONFIGS.find((r) => r.path === '/users');
    const userEndpoints = usersRoute?.endpoints?.map((e) => e.path) || [];
    expect(userEndpoints).toContain('/me');
    expect(userEndpoints).toContain('/me/preferences');
    expect(userEndpoints).toContain('/me/saved');
  });

  it('should have wallet endpoints', () => {
    const walletRoute = SERVICE_CONFIGS.find((r) => r.path === '/wallet');
    const walletEndpoints = walletRoute?.endpoints?.map((e) => e.path) || [];
    expect(walletEndpoints).toContain('/');
    expect(walletEndpoints).toContain('/transactions');
    expect(walletEndpoints).toContain('/fund');
    expect(walletEndpoints).toContain('/withdraw');
  });

  it('should have content endpoints', () => {
    const contentRoute = SERVICE_CONFIGS.find((r) => r.path === '/content');
    const contentEndpoints = contentRoute?.endpoints?.map((e) => e.path) || [];
    expect(contentEndpoints).toContain('/');
    expect(contentEndpoints).toContain('/:id');
    expect(contentEndpoints).toContain('/:id/comments');
  });

  it('should have payment endpoints', () => {
    const paymentRoute = SERVICE_CONFIGS.find((r) => r.path === '/payments');
    expect(paymentRoute).toBeDefined();
    const paymentEndpoints = paymentRoute?.endpoints?.map((e) => e.path) || [];
    expect(paymentEndpoints).toContain('/initialize');
    expect(paymentEndpoints).toContain('/verify');
  });

  it('should have support service with comprehensive endpoints', () => {
    const supportRoute = SERVICE_CONFIGS.find((r) => r.path === '/support');
    expect(supportRoute).toBeDefined();
    const supportEndpoints = supportRoute?.endpoints?.map((e) => e.path) || [];
    expect(supportEndpoints).toContain('/tickets');
    expect(supportEndpoints).toContain('/tickets/my');
    expect(supportEndpoints).toContain('/refunds/pending');
  });

  it('should have creators service with correct path', () => {
    const creatorsRoute = SERVICE_CONFIGS.find((r) => r.path === '/creators');
    expect(creatorsRoute).toBeDefined();
    expect(creatorsRoute?.envKey).toBe('CREATOR_SERVICE_URL');
  });

  it('should have all services with valid env keys', () => {
    SERVICE_CONFIGS.forEach((route) => {
      expect(route.envKey).toBeTruthy();
      expect(route.envKey).toContain('_URL');
    });
  });

  it('should have all services with supported versions', () => {
    SERVICE_CONFIGS.forEach((route) => {
      expect(route.supportedVersions).toBeDefined();
      expect(route.supportedVersions.length).toBeGreaterThan(0);
      expect(route.defaultVersion).toBeDefined();
    });
  });

  it('should have auth service with correct path strategy', () => {
    const authRoute = SERVICE_CONFIGS.find((r) => r.path === '/auth');
    expect(authRoute).toBeDefined();
    expect(authRoute?.pathStrategy).toBe('auth-service-strategy');
  });

  it('should have notification service with admin endpoints', () => {
    const notificationRoute = SERVICE_CONFIGS.find((r) => r.path === '/notifications');
    expect(notificationRoute).toBeDefined();
    const endpoints = notificationRoute?.endpoints?.map((e) => e.path) || [];
    expect(endpoints).toContain('/push-tokens');
    expect(endpoints).toContain('/preferences');
  });

  it('should have engagement service with leaderboard endpoint', () => {
    const engagementRoute = SERVICE_CONFIGS.find((r) => r.path === '/engagement');
    expect(engagementRoute).toBeDefined();
    const endpoints = engagementRoute?.endpoints?.map((e) => e.path) || [];
    expect(endpoints).toContain('/leaderboard');
  });

  it('should have subscription service with plan endpoints', () => {
    const subscriptionRoute = SERVICE_CONFIGS.find((r) => r.path === '/subscription');
    expect(subscriptionRoute).toBeDefined();
    const endpoints = subscriptionRoute?.endpoints?.map((e) => e.path) || [];
    expect(endpoints).toContain('/plans');
    expect(endpoints).toContain('/subscribe');
  });
});

describe('Proxy Controller - Admin universe-flag undo routes', () => {
  const adminRoute = () => SERVICE_CONFIGS.find((r) => r.path === '/admin');

  it('routes /admin to the admin service (default strategy: /v1/admin/*)', () => {
    const route = adminRoute();
    expect(route).toBeDefined();
    expect(route?.envKey).toBe('ADMIN_SERVICE_URL');
    expect(route?.fallbackUrl).toBe('http://admin-app:4016');
    // apps/admin serves URI-versioned routes (/v1/admin/...), so the gateway
    // must use the default strategy that preserves the version prefix.
    expect(route?.pathStrategy).toBe('default');
  });

  it('registers POST /universes/feature-flags/restore for forwarding', () => {
    const endpoints = adminRoute()?.endpoints ?? [];
    const restore = endpoints.find((e) => e.path === '/universes/feature-flags/restore');
    expect(restore).toBeDefined();
    expect(restore?.method).toBe('POST');
    // The prune + recently-deleted siblings ride the same no-prefix path, so
    // ops can undo a prune without a redeploy.
    expect(
      endpoints.some(
        (e) => e.method === 'POST' && e.path === '/universes/feature-flags/prune-stale'
      )
    ).toBe(true);
    expect(
      endpoints.some((e) => e.method === 'GET' && e.path === '/universes/feature-flags/deleted')
    ).toBe(true);
  });
});

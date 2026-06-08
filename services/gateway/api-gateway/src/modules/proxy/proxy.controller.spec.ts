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
});
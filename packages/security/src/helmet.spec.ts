import { createHelmetConfig, defaultSecurityHeadersConfig } from './helmet.config';

describe('defaultSecurityHeadersConfig', () => {
  it('should have secure defaults', () => {
    expect(defaultSecurityHeadersConfig.hstsMaxAge).toBe(31536000);
    expect(defaultSecurityHeadersConfig.contentSecurityPolicy).toBe(true);
    expect(defaultSecurityHeadersConfig.crossOriginEmbedderPolicy).toBe(true);
    expect(defaultSecurityHeadersConfig.crossOriginOpenerPolicy).toBe(true);
    expect(defaultSecurityHeadersConfig.crossOriginResourcePolicy).toBe(true);
    expect(defaultSecurityHeadersConfig.referrerPolicy).toBe('strict-origin-when-cross-origin');
    expect(defaultSecurityHeadersConfig.xFrameOptions).toBe(true);
    expect(defaultSecurityHeadersConfig.xContentTypeOptions).toBe(true);
    expect(defaultSecurityHeadersConfig.xPoweredBy).toBe(true);
  });
});

describe('createHelmetConfig', () => {
  it('should return a function (helmet middleware)', () => {
    const config = createHelmetConfig();
    expect(typeof config).toBe('function');
  });

  it('should accept custom config', () => {
    const config = createHelmetConfig({
      contentSecurityPolicy: false,
      hstsMaxAge: 0,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      referrerPolicy: 'no-referrer',
      xssProtection: false,
      xContentTypeOptions: false,
      xDnsPrefetchControl: false,
      xDownloadOptions: false,
      xFrameOptions: true,
      xPermittedCrossDomainPolicies: false,
      xPoweredBy: false,
      xXssProtection: false,
    });
    expect(typeof config).toBe('function');
  });

  it('should use default config when no args provided', () => {
    // Should not throw
    const config = createHelmetConfig();
    expect(config).toBeDefined();
  });

  it('should produce helmet middleware that can be called', () => {
    const middleware = createHelmetConfig();
    // The returned value is a helmet middleware function
    expect(typeof middleware).toBe('function');
    // Verify it has the expected middleware signature (req, res, next)
    expect(middleware.length).toBeGreaterThanOrEqual(2);
  });
});

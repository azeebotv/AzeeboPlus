import { configureCors } from './cors.config';

describe('configureCors', () => {
  let mockApp: { enableCors: jest.Mock };

  beforeEach(() => {
    mockApp = { enableCors: jest.fn() };
  });

  it('should call enableCors with correct configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureCors(mockApp as any, {
      allowedOrigins: ['https://azeeboplus.com'],
    });

    expect(mockApp.enableCors).toHaveBeenCalledTimes(1);
    const config = mockApp.enableCors.mock.calls[0][0];
    expect(config.methods).toContain('GET');
    expect(config.methods).toContain('POST');
    expect(config.credentials).toBe(true);
    expect(config.maxAge).toBe(3600);
  });

  it('should throw for wildcard origin', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configureCors(mockApp as any, {
        allowedOrigins: ['*'],
      });
    }).toThrow('CORS wildcard (*) is not allowed');
  });

  it('should throw for invalid origin URL', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configureCors(mockApp as any, {
        allowedOrigins: ['not-a-url'],
      });
    }).toThrow('Invalid CORS origin');
  });

  it('should accept custom maxAge and credentials', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureCors(mockApp as any, {
      allowedOrigins: ['https://azeeboplus.com'],
      credentials: false,
      maxAge: 7200,
    });

    const config = mockApp.enableCors.mock.calls[0][0];
    expect(config.credentials).toBe(false);
    expect(config.maxAge).toBe(7200);
  });

  it('should configure allowed headers', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureCors(mockApp as any, {
      allowedOrigins: ['https://azeeboplus.com'],
    });

    const config = mockApp.enableCors.mock.calls[0][0];
    expect(config.allowedHeaders).toContain('Content-Type');
    expect(config.allowedHeaders).toContain('Authorization');
    expect(config.allowedHeaders).toContain('X-Request-ID');
  });

  it('should configure exposed headers', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureCors(mockApp as any, {
      allowedOrigins: ['https://azeeboplus.com'],
    });

    const config = mockApp.enableCors.mock.calls[0][0];
    expect(config.exposedHeaders).toContain('X-Request-ID');
    expect(config.exposedHeaders).toContain('X-RateLimit-Limit');
  });

  describe('origin validation callback', () => {
    it('should allow matching origins', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configureCors(mockApp as any, {
        allowedOrigins: ['https://azeeboplus.com'],
      });

      const originCallback = mockApp.enableCors.mock.calls[0][0].origin;
      const callback = jest.fn();
      originCallback('https://azeeboplus.com', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-matching origins', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configureCors(mockApp as any, {
        allowedOrigins: ['https://azeeboplus.com'],
      });

      const originCallback = mockApp.enableCors.mock.calls[0][0].origin;
      const callback = jest.fn();
      originCallback('https://evil.com', callback);
      // Standard denial: proceed without CORS headers (browser enforces the
      // block). Never reject with an Error — that would 500 the request.
      expect(callback).toHaveBeenCalledWith(null, false);
    });

    it('should allow missing origin for server-to-server requests', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configureCors(mockApp as any, {
        allowedOrigins: ['https://azeeboplus.com'],
      });

      const originCallback = mockApp.enableCors.mock.calls[0][0].origin;
      const callback = jest.fn();
      originCallback(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });
  });
});

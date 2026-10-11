jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios },
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3013',
      },
    },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../utils/certificatePinning', () => ({
  certificatePinningService: { setup: jest.fn(), fetchWithPinning: jest.fn() },
}));

(globalThis as Record<string, unknown>).__DEV__ = true;

describe('gatewayPath', () => {
  let gatewayPath: (endpoint: string) => string;

  beforeAll(() => {
    jest.isolateModules(() => {
      const clientModule = require('../client');
      gatewayPath = clientModule.gatewayPath;
    });
  });

  it('should return path as-is if it starts with /api/', () => {
    expect(gatewayPath('/api/v1/test')).toBe('/api/v1/test');
    expect(gatewayPath('/api/health')).toBe('/api/health');
  });

  it('should prefix /api/ to paths starting with /v1/', () => {
    expect(gatewayPath('/v1/wallet')).toBe('/api/v1/wallet');
    expect(gatewayPath('/v1/users/me')).toBe('/api/v1/users/me');
  });

  it('should prefix /api/v1 to paths without any prefix', () => {
    expect(gatewayPath('/auth/login')).toBe('/api/v1/auth/login');
    expect(gatewayPath('/health')).toBe('/api/v1/health');
  });

  it('should handle empty string', () => {
    expect(gatewayPath('')).toBe('/api/v1');
  });
});

describe('apiClient Idempotency-Key header', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let freshClient: any;
  let fetchWithPinning: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    fetchWithPinning = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    jest.doMock('../../utils/certificatePinning', () => ({
      certificatePinningService: {
        setup: jest.fn(),
        fetchWithPinning,
      },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    freshClient = require('../client').apiClient;
  });

  it('adds an Idempotency-Key header to POST requests', async () => {
    await freshClient.post('/v1/wallet/withdraw', { amount: 100 });

    const [, init] = fetchWithPinning.mock.calls[0];
    expect(init.headers['Idempotency-Key']).toMatch(/^idemp-/);
  });

  it('does not add an Idempotency-Key header to GET requests', async () => {
    await freshClient.get('/v1/wallet');

    const [, init] = fetchWithPinning.mock.calls[0];
    expect(init.headers['Idempotency-Key']).toBeUndefined();
  });

  it('preserves a caller-supplied Idempotency-Key', async () => {
    await freshClient.post(
      '/v1/wallet/withdraw',
      { amount: 100 },
      { headers: { 'Idempotency-Key': 'caller-key-1' } }
    );

    const [, init] = fetchWithPinning.mock.calls[0];
    expect(init.headers['Idempotency-Key']).toBe('caller-key-1');
  });
});

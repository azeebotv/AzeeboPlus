import axios from 'axios';
import {
  withRetry,
  ApiClient,
  ServiceClient,
  AuthServiceClient,
  WalletServiceClient,
  PaymentServiceClient,
  createApiClient,
  createServiceClients,
  generateIdempotencyKey,
  NoopTokenStorage,
} from './index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockAxiosFn: any;
function createMockAxiosInstance() {
  mockAxiosFn = jest.fn();
  mockAxiosFn.interceptors = {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn() },
  };
  mockAxiosFn.get = jest.fn();
  mockAxiosFn.post = jest.fn();
  mockAxiosFn.put = jest.fn();
  mockAxiosFn.patch = jest.fn();
  mockAxiosFn.delete = jest.fn();
  return mockAxiosFn;
}

// Mock axios.isAxiosError to work with our test objects
(mockedAxios as any).isAxiosError = jest.fn().mockImplementation(
  (error: any) => error?.response?.status !== undefined || error?.code !== undefined
);

let mockCryptoUuidCounter = 0;
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => {
    mockCryptoUuidCounter++;
    return `mock-uuid-${mockCryptoUuidCounter}`;
  }),
}));

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after exhausting retries', async () => {
    const error = new Error('Persistent failure');
    const fn = jest.fn().mockRejectedValue(error);

    // Use real timers so setTimeout rejects naturally
    jest.useRealTimers();
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 1 })).rejects.toThrow('Persistent failure');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect custom retryOn condition', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Some non-retry error'))
      .mockRejectedValueOnce(new Error('Should not get here'));

    jest.useRealTimers();
    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        retryOn: (error) => error.message.includes('retryable'),
      })
    ).rejects.toThrow('Some non-retry error');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should apply exponential backoff with jitter', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    const startTime = Date.now();
    jest.useRealTimers();
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 5, jitterFactor: 0 })).rejects.toThrow();
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(10);
  }, 10000);

  it('should use default retry options', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
  });
});

describe('generateIdempotencyKey', () => {
  beforeEach(() => {
    mockCryptoUuidCounter = 0;
  });

  it('should generate a key with idemp- prefix', () => {
    const key = generateIdempotencyKey();
    expect(key).toContain('idemp-');
  });

  it('should generate unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateIdempotencyKey()));
    expect(keys.size).toBeGreaterThan(1);
  });
});

describe('NoopTokenStorage', () => {
  const storage = new NoopTokenStorage();

  it('should return null for access token', async () => {
    expect(await storage.getAccessToken()).toBeNull();
  });

  it('should return null for refresh token', async () => {
    expect(await storage.getRefreshToken()).toBeNull();
  });

  it('should not throw on set operations', async () => {
    await expect(storage.setAccessToken('token')).resolves.toBeUndefined();
    await expect(storage.setRefreshToken('refresh')).resolves.toBeUndefined();
  });

  it('should not throw on clear', async () => {
    await expect(storage.clearTokens()).resolves.toBeUndefined();
  });
});

describe('ApiClient', () => {
  let client: ApiClient;
  let axiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosInstance = createMockAxiosInstance();
    (mockedAxios.create as jest.Mock).mockReturnValue(axiosInstance);

    client = new ApiClient({
      baseUrl: 'http://test-api.com',
      tokenStorage: new NoopTokenStorage(),
    });
  });

  describe('constructor', () => {
    it('should create with default timeout', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://test-api.com',
          timeout: 30000,
        })
      );
    });

    it('should create with custom config', () => {
      new ApiClient({
        baseUrl: 'http://custom.com',
        timeout: 5000,
        tokenStorage: new NoopTokenStorage(),
        defaultHeaders: { 'X-Custom': 'value' },
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom.com',
          timeout: 5000,
          headers: expect.objectContaining({ 'X-Custom': 'value' }),
        })
      );
    });

    it('should set up request interceptor', () => {
      expect(axiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should set up response interceptor', () => {
      expect(axiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      // Mock the axios instance function used by requestWithRetry
      axiosInstance.mockResolvedValue({ data: 'get-data' });
    });

    it('should perform GET request', async () => {
      axiosInstance.mockResolvedValue({ data: { items: [] } });
      const result = await client.get('/users');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ items: [] });
    });

    it('should perform POST request', async () => {
      axiosInstance.mockResolvedValue({ data: 'post-data' });
      const result = await client.post('/users', { name: 'John' });
      expect(result.success).toBe(true);
      expect(result.data).toBe('post-data');
    });

    it('should perform PUT request', async () => {
      axiosInstance.mockResolvedValue({ data: 'put-data' });
      const result = await client.put('/users/1', { name: 'Jane' });
      expect(result.success).toBe(true);
      expect(result.data).toBe('put-data');
    });

    it('should perform PATCH request', async () => {
      axiosInstance.mockResolvedValue({ data: 'patch-data' });
      const result = await client.patch('/users/1', { name: 'Jane' });
      expect(result.success).toBe(true);
      expect(result.data).toBe('patch-data');
    });

    it('should perform DELETE request', async () => {
      axiosInstance.mockResolvedValue({ data: 'delete-data' });
      const result = await client.delete('/users/1');
      expect(result.success).toBe(true);
      expect(result.data).toBe('delete-data');
    });

    it('should return error response on failure', async () => {
      axiosInstance.mockRejectedValue({
        response: { status: 500, data: { message: 'Server error', code: 'SERVER_ERROR' } },
      });

      const result = await client.get('/error');
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Server error');
    }, 10000);
  });

  describe('retry behavior', () => {
    it('should retry on 429 status', async () => {
      const mockError = {
        response: { status: 429 },
      };

      axiosInstance
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: 'success' });

      const result = await client.get('/retry');
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should retry on 5xx status', async () => {
      const mockError = {
        response: { status: 503 },
      };

      axiosInstance
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: 'recovered' });

      const result = await client.get('/retry-5xx');
      expect(result.success).toBe(true);
      expect(result.data).toBe('recovered');
    });

    it('should not retry on 4xx (non-429) status', async () => {
      const mockError = {
        response: { status: 400, data: { message: 'Bad request' } },
      };

      axiosInstance.mockRejectedValue(mockError);

      const result = await client.get('/bad-request');
      expect(result.success).toBe(false);
      expect(axiosInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('withIdempotencyKey', () => {
    it('should set idempotency key interceptor', () => {
      const result = client.withIdempotencyKey('custom-key');
      expect(result).toBe(client);
    });
  });

  describe('withTraceHeader', () => {
    it('should set trace header interceptor', () => {
      const result = client.withTraceHeader('trace-123');
      expect(result).toBe(client);
    });
  });

  describe('getClient', () => {
    it('should return the underlying axios instance', () => {
      expect(client.getClient()).toBe(axiosInstance);
    });
  });
});

describe('ServiceClient', () => {
  let serviceClient: ServiceClient;
  let axiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosInstance = createMockAxiosInstance();
    (mockedAxios.create as jest.Mock).mockReturnValue(axiosInstance);
    delete process.env.INTERNAL_API_KEY;

    serviceClient = new ServiceClient({
      baseURL: 'http://internal-service:3000',
      apiKey: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create with API key header', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://internal-service:3000',
          headers: expect.objectContaining({
            'x-internal-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should create without API key', () => {
      jest.clearAllMocks();
      axiosInstance = createMockAxiosInstance();
      (mockedAxios.create as jest.Mock).mockReturnValue(axiosInstance);

      new ServiceClient({
        baseURL: 'http://internal-service:3000',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'x-internal-api-key': expect.anything(),
          }),
        })
      );
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      axiosInstance.get.mockResolvedValue({ data: 'get-result' });
      axiosInstance.post.mockResolvedValue({ data: 'post-result' });
      axiosInstance.put.mockResolvedValue({ data: 'put-result' });
      axiosInstance.patch.mockResolvedValue({ data: 'patch-result' });
      axiosInstance.delete.mockResolvedValue({ data: 'delete-result' });
    });

    it('should perform GET request', async () => {
      const result = await serviceClient.get('/data');
      expect(result).toBe('get-result');
    });

    it('should perform POST request with idempotency key', async () => {
      const result = await serviceClient.post('/data', { key: 'value' });
      expect(result).toBe('post-result');
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/data',
        { key: 'value' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
    });

    it('should perform PUT request', async () => {
      const result = await serviceClient.put('/data/1', { name: 'test' });
      expect(result).toBe('put-result');
    });

    it('should perform PATCH request', async () => {
      const result = await serviceClient.patch('/data/1', { name: 'test' });
      expect(result).toBe('patch-result');
    });

    it('should perform DELETE request', async () => {
      const result = await serviceClient.delete('/data/1');
      expect(result).toBe('delete-result');
    });
  });

  describe('retryRequest', () => {
    it('should succeed on first attempt', async () => {
      const request = jest.fn().mockResolvedValue({ data: 'ok' });
      const result = await (serviceClient as any).retryRequest(request, 3, 10);
      expect(result).toEqual({ data: 'ok' });
    });

    it('should retry on retryable error', async () => {
      jest.useFakeTimers({ legacyFakeTimers: false });
      // Create an error that passes isRetryableError
      const retryableError = new Error('ECONNREFUSED') as any;
      retryableError.code = 'ECONNREFUSED';

      const request = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({ data: 'recovered' });

      const resultPromise = (serviceClient as any).retryRequest(request, 1, 10);
      await jest.advanceTimersByTimeAsync(50);
      const result = await resultPromise;

      expect(result).toEqual({ data: 'recovered' });
      expect(request).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });

  describe('isRetryableError', () => {
    it('should return true for 408 status', () => {
      expect((serviceClient as any).isRetryableError({ response: { status: 408 } })).toBe(true);
    });

    it('should return true for 429 status', () => {
      expect((serviceClient as any).isRetryableError({ response: { status: 429 } })).toBe(true);
    });

    it('should return true for 502/503/504 status', () => {
      expect((serviceClient as any).isRetryableError({ response: { status: 502 } })).toBe(true);
      expect((serviceClient as any).isRetryableError({ response: { status: 503 } })).toBe(true);
      expect((serviceClient as any).isRetryableError({ response: { status: 504 } })).toBe(true);
    });

    it('should return true for connection errors', () => {
      expect((serviceClient as any).isRetryableError({ code: 'ECONNABORTED', response: undefined })).toBe(true);
      expect((serviceClient as any).isRetryableError({ code: 'ECONNREFUSED', response: undefined })).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect((serviceClient as any).isRetryableError({ response: { status: 400 } })).toBe(false);
      expect((serviceClient as any).isRetryableError({ response: { status: 401 } })).toBe(false);
      expect((serviceClient as any).isRetryableError({ response: { status: 403 } })).toBe(false);
    });
  });
});

describe('Service-specific clients', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = createMockAxiosInstance();
    mockInstance.get.mockResolvedValue({ data: {} });
    mockInstance.post.mockResolvedValue({ data: {} });
    mockInstance.put.mockResolvedValue({ data: {} });
    (mockedAxios.create as jest.Mock).mockReturnValue(mockInstance);
  });

  describe('AuthServiceClient', () => {
    it('should validate token', async () => {
      mockInstance.get.mockResolvedValue({ data: { userId: 'u1', roles: ['user'] } });
      const client = new AuthServiceClient();
      await client.validateToken('test-token');
      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('should refresh token', async () => {
      mockInstance.post.mockResolvedValue({ data: { accessToken: 'new-token', refreshToken: 'new-refresh' } });
      const client = new AuthServiceClient();
      await client.refreshToken('refresh-token');
    });
  });

  describe('WalletServiceClient', () => {
    it('should debit wallet', async () => {
      mockInstance.post.mockResolvedValue({ data: { balance: '900' } });
      const client = new WalletServiceClient();
      await client.debitWallet('wallet-1', 100, 'test', 'idemp-1');
    });

    it('should credit wallet', async () => {
      mockInstance.post.mockResolvedValue({ data: { balance: '1100' } });
      const client = new WalletServiceClient();
      await client.creditWallet('wallet-1', 100, 'test');
    });

    it('should get wallet', async () => {
      mockInstance.get.mockResolvedValue({ data: { id: 'w1', userId: 'u1', balance: '1000', currency: 'NGN' } });
      const client = new WalletServiceClient();
      await client.getWallet('user-1');
    });
  });

  describe('PaymentServiceClient', () => {
    it('should create transaction', async () => {
      mockInstance.post.mockResolvedValue({ data: { id: 'txn-1', status: 'pending' } });
      const client = new PaymentServiceClient();
      await client.createTransaction('user-1', 100, 'stripe');
    });

    it('should verify transaction', async () => {
      mockInstance.get.mockResolvedValue({ data: { id: 'txn-1', status: 'success', amount: 100 } });
      const client = new PaymentServiceClient();
      await client.verifyTransaction('txn-1');
    });

    it('should create refund', async () => {
      mockInstance.post.mockResolvedValue({ data: { id: 'ref-1', status: 'pending' } });
      const client = new PaymentServiceClient();
      await client.createRefund('txn-1', 50);
    });
  });
});

describe('createApiClient', () => {
  it('should create a new ApiClient', () => {
    const instance = createMockAxiosInstance();
    (mockedAxios.create as jest.Mock).mockReturnValue(instance);

    const client = createApiClient({
      baseUrl: 'http://test.com',
      tokenStorage: new NoopTokenStorage(),
    });
    expect(client).toBeInstanceOf(ApiClient);
  });
});

describe('createServiceClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const instance = createMockAxiosInstance();
    (mockedAxios.create as jest.Mock).mockReturnValue(instance);
  });

  it('should create all service clients', () => {
    const clients = createServiceClients();
    expect(clients.auth).toBeInstanceOf(AuthServiceClient);
    expect(clients.wallet).toBeInstanceOf(WalletServiceClient);
    expect(clients.payment).toBeInstanceOf(PaymentServiceClient);
    expect(clients.analytics).toBeDefined();
    expect(clients.notification).toBeDefined();
    expect(clients.content).toBeDefined();
    expect(clients.user).toBeDefined();
  });
});

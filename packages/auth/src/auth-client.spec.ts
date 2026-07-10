import { AuthClient, createMemoryAuthClient } from './auth-client';

// Mock global fetch
const mockFetch = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = mockFetch;

function createMockStorage() {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  return {
    getAccessToken: jest.fn(async () => accessToken),
    getRefreshToken: jest.fn(async () => refreshToken),
    setAccessToken: jest.fn(async (token: string) => {
      accessToken = token;
    }),
    setRefreshToken: jest.fn(async (token: string) => {
      refreshToken = token;
    }),
    clearTokens: jest.fn(async () => {
      accessToken = null;
      refreshToken = null;
    }),
    _getAccessToken: () => accessToken,
    _getRefreshToken: () => refreshToken,
  };
}

describe('AuthClient', () => {
  let storage: ReturnType<typeof createMockStorage>;
  let client: AuthClient;

  beforeEach(() => {
    mockFetch.mockReset();
    storage = createMockStorage();
    client = new AuthClient({
      baseUrl: 'https://api.test.com',
      storage,
    });
  });

  describe('login', () => {
    it('should send login request and store tokens on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessToken: 'access-123',
            refreshToken: 'refresh-123',
            user: { id: 'u1', email: 'test@test.com', name: 'Test' },
          },
        }),
      });

      const result = await client.login({ email: 'test@test.com', password: 'pass' });

      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('access-123');
      expect(storage.setAccessToken).toHaveBeenCalledWith('access-123');
      expect(storage.setRefreshToken).toHaveBeenCalledWith('refresh-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should return error response on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      const result = await client.login({ email: 'test@test.com', password: 'wrong' });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(storage.setAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should send register request and store tokens on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessToken: 'access-new',
            refreshToken: 'refresh-new',
            user: { id: 'u2', email: 'new@test.com', name: 'New' },
          },
        }),
      });

      const result = await client.register({
        name: 'New',
        email: 'new@test.com',
        password: 'pass',
      });

      expect(result.success).toBe(true);
      expect(storage.setAccessToken).toHaveBeenCalledWith('access-new');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/signup',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.logout();

      expect(storage.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if server request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await client.logout();

      expect(storage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('request', () => {
    it('should attach Authorization header when token exists', async () => {
      storage.getAccessToken.mockResolvedValueOnce('my-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      });

      await client.request('/users/me');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('should not attach Authorization header when no token', async () => {
      storage.getAccessToken.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      });

      await client.request('/users/me');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      storage.getAccessToken.mockResolvedValueOnce(null);
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await client.request('/users/me');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to fetch');
      expect(result.statusCode).toBe(0);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token using stored refresh token', async () => {
      storage.getRefreshToken.mockResolvedValueOnce('refresh-abc');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        }),
      });

      const result = await client.refreshToken();

      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('new-access');
      expect(storage.setAccessToken).toHaveBeenCalledWith('new-access');
    });

    it('should fail when no refresh token available', async () => {
      storage.getRefreshToken.mockResolvedValueOnce(null);

      const result = await client.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe('No refresh token available');
    });

    it('should deduplicate concurrent refresh calls', async () => {
      storage.getRefreshToken.mockResolvedValue('refresh-abc');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        }),
      });

      // Make two concurrent refresh calls
      const [result1, result2] = await Promise.all([client.refreshToken(), client.refreshToken()]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Only one fetch call should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user profile', async () => {
      storage.getAccessToken.mockResolvedValueOnce('token-123');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'u1', email: 'test@test.com', name: 'Test' },
        }),
      });

      const result = await client.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('u1');
    });

    it('should auto-refresh on 401 and retry', async () => {
      storage.getAccessToken
        .mockResolvedValueOnce('expired-token') // first call
        .mockResolvedValueOnce('new-token'); // retry after refresh
      storage.getRefreshToken.mockResolvedValue('refresh-abc');

      // First call returns 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
        })
        // Refresh call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          }),
        })
        // Retry call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { id: 'u1', name: 'Test' },
          }),
        });

      const result = await client.getCurrentUser();

      expect(result.success).toBe(true);
    });
  });
});

describe('createMemoryAuthClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should create an AuthClient with in-memory storage', () => {
    const client = createMemoryAuthClient({
      baseUrl: 'https://api.test.com',
    });
    expect(client).toBeInstanceOf(AuthClient);
  });

  it('should store and retrieve tokens in memory', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          accessToken: 'mem-access',
          refreshToken: 'mem-refresh',
          user: { id: 'u1', email: 'test@test.com', name: 'Test' },
        },
      }),
    });

    const client = createMemoryAuthClient({
      baseUrl: 'https://api.test.com',
    });

    await client.login({ email: 'test@test.com', password: 'pass' });

    // Make a request to verify token was stored
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'u1' } }),
    });

    await client.request('/users/me');

    const callHeaders = mockFetch.mock.calls[1][1].headers;
    expect(callHeaders.Authorization).toBe('Bearer mem-access');
  });
});

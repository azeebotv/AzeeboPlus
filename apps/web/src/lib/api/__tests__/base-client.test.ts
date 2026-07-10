import { describe, it, expect, beforeEach, vi } from 'vitest';

// base.ts throws at module load time if NEXT_PUBLIC_API_BASE_URL is missing.
// We use dynamic imports after vi.stubEnv so the module loads with the env set.

describe('gatewayPath()', () => {
  it('should return /api/ paths unchanged', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://test.api');
    const { gatewayPath } = await import('../base.js');
    expect(gatewayPath('/api/v1/content')).toBe('/api/v1/content');
  });

  it('should prepend /api to /v1/ paths', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://test.api');
    const { gatewayPath } = await import('../base.js');
    expect(gatewayPath('/v1/auth/login')).toBe('/api/v1/auth/login');
  });

  it('should prepend /api/v1 to bare paths', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://test.api');
    const { gatewayPath } = await import('../base.js');
    expect(gatewayPath('/content')).toBe('/api/v1/content');
  });

  it('should handle empty path', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://test.api');
    const { gatewayPath } = await import('../base.js');
    expect(gatewayPath('')).toBe('/api/v1');
  });
});

describe('apiFetch — standalone fetch helper', () => {
  let apiFetch: typeof import('../base').apiFetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://test.api');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    // Re-import to pick up env
    const mod = await import('../base.js');
    apiFetch = mod.apiFetch;
  });

  describe('Authentication Headers', () => {
    it('should include Authorization header when token is in localStorage', async () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => (key === 'azeebo_access_token' ? 'stored-token' : null)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { id: '1' } }),
      });

      const { apiFetch: freshApiFetch } = await import('../base.js');
      await freshApiFetch('/api/v1/users/me');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer stored-token');
    });

    it('should not include Authorization header when no token in localStorage', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await apiFetch('/api/v1/public/universes');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('HTTP Status Code Handling', () => {
    it('should return success for 200 OK', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { id: '1' }, message: 'OK' }),
      });

      const result = await apiFetch('/api/v1/content/c1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '1' });
      expect(result.message).toBe('OK');
    });

    it('should return success for 201 Created with data fallback', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'new-1', title: 'Created' }),
      });

      const result = await apiFetch('/api/v1/content', {
        method: 'POST',
        body: JSON.stringify({ title: 'New' }),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'new-1', title: 'Created' });
    });

    it('should handle 400 Bad Request with error details', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { fieldErrors: { email: ['Invalid format'] } },
        }),
      });

      const result = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Validation failed');
    });

    it('should handle 401 Unauthorized', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Token expired' }),
      });

      const result = await apiFetch('/api/v1/users/me');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.message).toBe('Token expired');
    });

    it('should handle 403 Forbidden', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Access denied' }),
      });

      const result = await apiFetch('/api/v1/admin/users');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('should handle 404 Not Found', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Not found' }),
      });

      const result = await apiFetch('/api/v1/content/nonexistent');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should handle 409 Conflict', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          message: 'Email already exists',
          code: 'EMAIL_EXISTS',
        }),
      });

      const result = await apiFetch('/api/v1/auth/signup', { method: 'POST', body: '{}' });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(409);
    });

    it('should handle 429 Too Many Requests', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Rate limit exceeded' }),
      });

      const result = await apiFetch('/api/v1/auth/login', { method: 'POST', body: '{}' });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(429);
    });

    it('should handle 500 Internal Server Error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Internal server error' }),
      });

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
    });

    it('should handle 502 Bad Gateway', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Bad gateway' }),
      });

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(502);
    });

    it('should handle 503 Service Unavailable', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Service unavailable' }),
      });

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(503);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle TypeError (network down)', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.error).toBe('Failed to fetch');
    });

    it('should handle generic errors', async () => {
      fetchMock.mockRejectedValue(new Error('Something broke'));

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.error).toBe('Something broke');
    });

    it('should handle non-Error thrown values', async () => {
      fetchMock.mockRejectedValue('string error');

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('RFC 7807 Problem Details Passthrough', () => {
    it('should pass through RFC 7807 fields from backend', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/problem+json' }),
        json: async () => ({
          type: 'https://api.azeebo.com/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'The request body is invalid',
          instance: '/api/v1/auth/signup',
          code: 'VALIDATION_ERROR',
        }),
      });

      const result = await apiFetch('/api/v1/auth/signup', { method: 'POST', body: '{}' });

      expect(result.success).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = result as any;
      expect(r.status).toBe(400);
      expect(r.type).toBe('https://api.azeebo.com/errors/validation');
      expect(r.title).toBe('Validation Error');
      expect(r.detail).toBe('The request body is invalid');
      expect(r.instance).toBe('/api/v1/auth/signup');
      expect(r.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Request Configuration', () => {
    it('should pass custom headers through', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await apiFetch('/api/v1/content', {
        headers: { 'X-Custom-Header': 'custom-value' } as Record<string, string>,
      });

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should include credentials: include for CORS', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await apiFetch('/api/v1/content');

      expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
    });

    it('should set Content-Type to application/json', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await apiFetch('/api/v1/content');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should call the correct URL with baseUrl + gatewayPath', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await apiFetch('/api/v1/content');

      expect(fetchMock.mock.calls[0][0]).toBe('http://test.api/api/v1/content');
    });
  });

  describe('Response Data Handling', () => {
    it('should use response body when data field is absent', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Deleted' }),
      });

      const result = await apiFetch('/api/v1/content/c1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: 'Deleted' });
    });

    it('should preserve null data field using nullish coalescing', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: null }),
      });

      const result = await apiFetch('/api/v1/content/c1');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should use fallback message when error body has no message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred');
    });

    it('should use detail as message fallback when message is absent', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Detailed error info' }),
      });

      const result = await apiFetch('/api/v1/content');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Detailed error info');
    });
  });
});

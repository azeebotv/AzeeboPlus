import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthMethods } from '../auth';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Auth API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let auth: ReturnType<typeof createAuthMethods>;

  beforeEach(() => {
    client = createMockClient();
    auth = createAuthMethods(client);
  });

  describe('login', () => {
    it('should POST to /api/v1/auth/login with credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'tok',
          refresh_token: 'ref',
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
        },
      };
      client.request.mockResolvedValue(mockResponse);

      const result = await auth.login({ email: 'a@b.com', password: 'pass' });

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should propagate login failure', async () => {
      client.request.mockResolvedValue({ success: false, message: 'Invalid credentials' });

      const result = await auth.login({ email: 'a@b.com', password: 'wrong' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should POST to /api/v1/auth/signup with registration data', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'tok',
          refresh_token: 'ref',
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
        },
      };
      client.request.mockResolvedValue(mockResponse);

      const result = await auth.register({
        displayName: 'Test',
        email: 'a@b.com',
        password: 'pass',
      });

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ displayName: 'Test', email: 'a@b.com', password: 'pass' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should POST to /api/v1/auth/logout', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Logged out' } });

      await auth.logout();

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/logout', { method: 'POST' });
    });
  });

  describe('refreshToken', () => {
    it('should POST to /api/v1/auth/refresh with refresh token', async () => {
      const mockResponse = {
        success: true,
        data: { access_token: 'new-tok', refresh_token: 'new-ref' },
      };
      client.request.mockResolvedValue(mockResponse);

      const result = await auth.refreshToken('old-ref');

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken: 'old-ref' }) },
        { retryOn401: true }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('requestPasswordReset', () => {
    it('should POST to /api/v1/auth/forgot-password', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Email sent' } });

      await auth.requestPasswordReset('a@b.com');

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com' }),
      });
    });
  });

  describe('resetPassword', () => {
    it('should POST to /api/v1/auth/reset-password', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Reset' } });

      await auth.resetPassword('token123', 'newPass!1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: 'token123', newPassword: 'newPass!1' }),
      });
    });
  });

  describe('verifyEmail', () => {
    it('should POST to /api/v1/auth/verify-email', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Verified' } });

      await auth.verifyEmail('verify-token');

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: 'verify-token' }),
      });
    });
  });

  describe('verifyMFA', () => {
    it('should POST to /api/v1/auth/mfa/verify', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'tok',
          refresh_token: 'ref',
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
        },
      };
      client.request.mockResolvedValue(mockResponse);

      await auth.verifyMFA('123456');

      expect(client.request).toHaveBeenCalledWith('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });
    });
  });
});

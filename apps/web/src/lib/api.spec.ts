import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { api } from './api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Web App API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.setToken('mock-access-token');
  });

  describe('Auth API', () => {
    it('login should call POST /auth/login', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { access_token: 'mock-token', refresh_token: 'mock-refresh', user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' } } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.auth.login({ email: 'test@example.com', password: 'mock-password' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('register should call POST /auth/signup', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { access_token: 'mock-token', refresh_token: 'mock-refresh', user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' } } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.auth.register({ name: 'Test', email: 'test@example.com', password: 'mock-password' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signup'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('requestPasswordReset should call POST /auth/forgot-password', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, message: 'Password reset email sent' }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.auth.requestPasswordReset('test@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('resetPassword should call POST /auth/reset-password', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, message: 'Password reset successfully' }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.auth.resetPassword('mock-token', 'new-mock-password');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Wallet API', () => {
    it('getBalance should call GET /wallet', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { balance: 1000, currency: 'NGN' } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.wallet.getBalance();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wallet'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/v1/wallet'), expect.anything());
    });

    it('getTransactions should call GET /wallet/transactions with pagination', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.wallet.getTransactions(1, 20);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/transactions?page=1&limit=20'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('withdraw should call POST /wallet/withdraw', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, message: 'Withdrawal initiated' }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.wallet.withdraw(500, { bankCode: '001', accountNumber: '1234567890' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/withdraw'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('transfer should call POST /wallet/transfer', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, message: 'Transfer successful' }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.wallet.transfer(100, 'user2');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/transfer'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Payment API', () => {
    it('initialize should call POST /payments/initialize', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { reference: 'mock-ref123', authorizationUrl: 'https://payment.com' } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.payment.initialize({ amount: 1000, currency: 'NGN', email: 'test@example.com' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/initialize'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/v1/payments/initialize'), expect.anything());
    });

    it('verify should call GET /payments/verify', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { status: 'success', amount: 1000, currency: 'NGN', reference: 'mock-ref123' } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.payment.verify('mock-ref123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/verify?reference=mock-ref123'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('User API', () => {
    it('getProfile should call GET /users/me', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.user.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getWatchHistory should call GET /users/me/history', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.user.getWatchHistory(1, 20);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/history'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Authorization Header', () => {
    it('should include Authorization header when token is set', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { balance: 1000, currency: 'NGN' } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await api.wallet.getBalance();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer mock-access-token' }),
        })
      );
    });

    it('should not include Authorization header when token is null', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: true, data: { access_token: 'token', refresh_token: 'refresh', user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' } } }),
        ok: true,
      };
      mockFetch.mockResolvedValue(mockResponse);

      api.setToken(null);
      await api.auth.login({ email: 'test@example.com', password: 'mock-password' });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should return error response for non-ok status', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ success: false, message: 'Unauthorized', error: 'UNAUTHORIZED', statusCode: 401 }),
        ok: false,
        status: 401,
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await api.auth.login({ email: 'test@example.com', password: 'wrong' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(result.statusCode).toBe(401);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await api.wallet.getBalance();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error. Please check your connection.');
    });
  });
});

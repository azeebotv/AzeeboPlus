import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { authApi } from './auth';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('Auth API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call POST /auth/login with correct data', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
        },
      };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.login('test@example.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password123' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should call POST /auth/signup with correct data', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
        },
      };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.register({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', { email: 'test@example.com', password: 'password123', name: 'Test User' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should call POST /auth/forgot-password with email', async () => {
      const mockResponse = { success: true, message: 'Password reset email sent' };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.forgotPassword('test@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should call POST /auth/reset-password with token and new password', async () => {
      const mockResponse = { success: true, message: 'Password reset successfully' };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword('test-token', 'newPassword123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'test-token', newPassword: 'newPassword123' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should call POST /auth/verify-email with token', async () => {
      const mockResponse = { success: true, message: 'Email verified successfully' };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.verifyEmail('test-token');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', { token: 'test-token' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resendVerification', () => {
    it('should call POST /auth/resend-verification with email', async () => {
      const mockResponse = { success: true, message: 'Verification email sent' };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.resendVerification('test@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'test@example.com' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should call GET /auth/me', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
      };
      
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyOTP', () => {
    it('should call POST /auth/otp/verify with code', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
        },
      };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.verifyOTP('123456');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/otp/verify', { code: '123456' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resendOTP', () => {
    it('should call POST /auth/otp/send', async () => {
      const mockResponse = { success: true, message: 'OTP sent' };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.resendOTP();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/otp/send');
      expect(result).toEqual(mockResponse);
    });
  });
});

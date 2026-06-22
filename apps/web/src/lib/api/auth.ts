// Auth domain methods

import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, RequestClient } from './base';

export function createAuthMethods(client: RequestClient) {
  return {
    login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
      const response = await client.request<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as ApiResponse<AuthResponse>;
    },

    register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
      const response = await client.request<AuthResponse>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as ApiResponse<AuthResponse>;
    },

    logout: async (): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/auth/logout', {
        method: 'POST',
      });
    },

    refreshToken: async (
      refreshToken: string,
    ): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> => {
      // T-M15: Enable retryOn401 for clock-skew resilience on the refresh path.
      // Max 3 attempts with exponential backoff (1 s -> 2 s -> 4 s), respecting
      // any Retry-After header the server may return.
      return client.request<{ access_token: string; refresh_token: string }>(
        '/api/v1/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        },
        { retryOn401: true },
      );
    },

    verifyMFA: async (code: string): Promise<ApiResponse<AuthResponse>> => {
      return client.request<AuthResponse>('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    requestPasswordReset: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (
      token: string,
      newPassword: string,
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    },

    verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },

    resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
  };
}

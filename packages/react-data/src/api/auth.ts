import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  role: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * `/auth/select-role` answers flat — {success, message, access_token} with no
 * `data` envelope, unlike login/register. `access_token` is re-minted from the
 * now-current role so the caller stops presenting a token that claims the old
 * one; adopt it (see AuthContext.selectRole).
 */
export interface SelectRoleResponse {
  success: boolean;
  message: string;
  access_token?: string;
}

/** `creator` subsumes the viewer role, so there is no third selectable role. */
export type SelectableRole = 'user' | 'creator';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  lastActive: string;
  isCurrent: boolean;
  location?: string;
  os?: string;
  browser?: string;
  ip?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ access_token: string }>> => {
    return apiClient.post<ApiResponse<{ access_token: string }>>('/auth/refresh', { refreshToken });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
  },

  verifyOTP: async (code: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/otp/verify', { code });
  },

  resendOTP: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/otp/send');
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<ApiResponse<User>>('/auth/me');
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.patch<ApiResponse<User>>('/users/me', data);
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      token,
      newPassword,
    });
  },

  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token });
  },

  resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
  },

  getDevices: async (): Promise<ApiResponse<Device[]>> => {
    return apiClient.get<ApiResponse<Device[]>>('/auth/devices');
  },

  revokeDevice: async (deviceId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/auth/devices/${deviceId}`);
  },

  selectRole: async (role: SelectableRole): Promise<SelectRoleResponse> => {
    return apiClient.post<SelectRoleResponse>('/auth/select-role', { role });
  },

  // ─── Social OAuth ──────────────────────────────────────────────────

  getGoogleAuthorizeUrl: async (
    redirectUri?: string
  ): Promise<ApiResponse<{ state: string; authorizeUrl: string }>> => {
    const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    return apiClient.get<ApiResponse<{ state: string; authorizeUrl: string }>>(
      `/auth/social/google/authorize${query}`
    );
  },

  getAppleAuthorizeUrl: async (
    redirectUri?: string
  ): Promise<ApiResponse<{ state: string; authorizeUrl: string }>> => {
    const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    return apiClient.get<ApiResponse<{ state: string; authorizeUrl: string }>>(
      `/auth/social/apple/authorize${query}`
    );
  },

  socialCallback: async (data: {
    code: string;
    state: string;
    displayName?: string;
    error?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/social/callback', data);
  },

  // Legacy direct login endpoints (fallback)
  googleLogin: async (data: {
    idToken: string;
    email: string;
    displayName?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/social/google', data);
  },

  appleLogin: async (data: {
    identityToken: string;
    email: string;
    displayName?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/social/apple', data);
  },
};

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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
    return apiClient.patch<ApiResponse<User>>('/auth/me', data);
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, newPassword });
  },

  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token });
  },

  resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
  },
};

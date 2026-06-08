import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, apiClient, type User, type ApiResponse } from '../api';
import { useStorage } from '../hooks/useStorage';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, displayName: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<{ success: boolean; message?: string }>;
  resendOTP: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getItem, setItem, removeItem } = useStorage();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getItem('accessToken');
      const userData = await getItem('user');

      if (token && userData) {
        setUser(JSON.parse(userData));
        apiClient.setToken(token);
      }
    } catch (error) {
      logger.error('Auth check failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthResponse = async (response: ApiResponse<{ access_token: string; refresh_token: string; user: User }>) => {
    if (response.success && response.data) {
      const { access_token, refresh_token, user: userData } = response.data;
      await setItem('accessToken', access_token);
      await setItem('refreshToken', refresh_token);
      await setItem('user', JSON.stringify(userData));
      apiClient.setToken(access_token);
      setUser(userData);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        await handleAuthResponse(response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      logger.error('Login error', error);
      return { success: false, message: error.message || 'An error occurred during login' };
    }
  };

  const register = async (email: string, password: string, displayName: string, phone: string) => {
    try {
      const response = await authApi.register({ email, password, name: displayName, phone });
      if (response.success && response.data) {
        await handleAuthResponse(response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      logger.error('Register error', error);
      return { success: false, message: error.message || 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.error('Logout error', error);
    } finally {
      await removeItem('accessToken');
      await removeItem('refreshToken');
      await removeItem('user');
      apiClient.setToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email);
  };

  const verifyOTP = async (code: string) => {
    try {
      const response = await authApi.verifyOTP(code);
      if (response.success && response.data) {
        await handleAuthResponse(response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>);
        return { success: true };
      }
      return { success: false, message: response.message || 'OTP verification failed' };
    } catch (error: any) {
      logger.error('OTP verification error', error);
      return { success: false, message: error.message || 'An error occurred during OTP verification' };
    }
  };

  const resendOTP = async () => {
    await authApi.resendOTP();
  };

  const refreshUser = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        const userData = response.data as any;
        const userObj: User = {
          id: userData.id,
          email: userData.email,
          name: userData.displayName || userData.name,
          displayName: userData.displayName,
          role: userData.role,
          avatar: userData.avatar,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        };
        await setItem('user', JSON.stringify(userObj));
        setUser(userObj);
      }
    } catch (error) {
      logger.error('Failed to refresh user', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        verifyOTP,
        resendOTP,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
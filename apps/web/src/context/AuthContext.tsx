'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { api, User, AuthResponse } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleAuthResponse = useCallback((response: AuthResponse) => {
    const { access_token, refresh_token, user: userData } = response;
    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    api.setToken(access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('refreshToken', refresh_token);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await api.auth.refreshToken(refreshToken);
      if (response.success && response.data) {
        const newToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        api.setToken(newToken);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [refreshToken]);

  useEffect(() => {
    const loadUser = async (): Promise<void> => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
      } catch (error) {
        // Error handling is intentionally minimal
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(() => {
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    return (): void => {
      clearInterval(interval);
    };
  }, [refreshToken, refreshAccessToken]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.auth.login({ email, password });
      if (response.success && response.data) {
        handleAuthResponse(response.data);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.auth.register({ name, email, password });
      if (response.success && response.data) {
        handleAuthResponse(response.data);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await api.auth.logout();
      }
    } catch (error) {
      // Error handling is intentionally minimal
    } finally {
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      api.setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

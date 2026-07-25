'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
// useRouter is not needed — auth redirects use window.location for full page reloads
import { api, User, AuthResponse, setAuthCookie, clearAuthCookie } from '../lib/api';
import { webLogger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message?: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
  }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message?: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
  }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
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
const ACCESS_TOKEN_KEY = 'azeebo_access_token';
const REFRESH_TOKEN_KEY = 'azeebo_refresh_token';
const USER_KEY = 'azeebo_user';

// SECURITY NOTE: Access and refresh tokens are stored in localStorage, which is
// accessible to any JavaScript running on the page (XSS vulnerability). This is
// a known limitation. The mitigation is that the `auth` cookie used by middleware
// contains only the access token (not the refresh token), and server-side APIs
// verify the JWT signature. Future improvement: migrate to HttpOnly cookies to
// prevent XSS theft of tokens entirely. For now, strong CSP headers and XSS
// prevention are critical to protect against token theft.
//
// RECOMMENDATION: Migrate to HttpOnly cookies for token storage. This requires:
// 1. Server-side API to set/clear HttpOnly cookies on login/logout/refresh
// 2. Remove localStorage token storage
// 3. Update middleware to read from HttpOnly cookies
// See: https://nextjs.org/docs/app/building-your-application/authentication

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSession = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    api.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    clearAuthCookie();
  }, []);

  const persistTokens = useCallback(
    async (accessToken: string, newRefreshToken: string, userData: User) => {
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      api.setToken(accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }
      await setAuthCookie(accessToken);
    },
    []
  );

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken =
      typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
    if (!currentRefreshToken) {
      return false;
    }

    try {
      // Use ApiClient's attemptRefresh() which deduplicates concurrent attempts
      const data = await api.attemptRefresh();
      if (data) {
        // Update React state (localStorage is already updated by attemptRefresh)
        setToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setAuthCookie(data.access_token);

        return true;
      }
      // Refresh failed — clear session
      clearSession();
      return false;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession]);

  const handleAuthResponse = useCallback(
    async (response: AuthResponse) => {
      const { access_token, refresh_token, user: userData } = response;
      await persistTokens(access_token, refresh_token, userData);
    },
    [persistTokens]
  );

  /**
   * On mount, restore the session from localStorage.
   * If the access token is missing but the refresh token exists, attempt a refresh.
   * If the access token exists, validate it by fetching the user profile.
   */
  useEffect(() => {
    let cancelled = false;

    const loadSession = async (): Promise<void> => {
      try {
        const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        // Immediately set stored user to avoid flash of unauthenticated content
        if (storedUser && !cancelled) {
          try {
            const parsed = JSON.parse(storedUser);
            if (!parsed.id || !parsed.email) throw new Error('Invalid user data');
            setUser(parsed);
          } catch {
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
        }

        // Set the API token so requests work immediately
        if (storedAccessToken) {
          api.setToken(storedAccessToken);
          setToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setAuthCookie(storedAccessToken);
        }

        if (storedAccessToken) {
          // Validate the access token by fetching the user profile
          try {
            const response = await api.user.getProfile({ skipAuthRetry: true });
            if (cancelled) return;

            if (response.success && response.data) {
              const userData = response.data;
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
              setUser(userObj);
              localStorage.setItem(USER_KEY, JSON.stringify(userObj));
              if (storedAccessToken) setAuthCookie(storedAccessToken);
            } else {
              // Token invalid — try refresh
              const refreshed = await refreshAccessToken();
              if (cancelled) return;
              if (!refreshed) {
                clearSession();
              }
            }
          } catch {
            // Network error — keep the stored session (offline support)
            // Set the auth cookie so middleware doesn't redirect to login
            if (storedAccessToken && !cancelled) {
              setAuthCookie(storedAccessToken);
            }
          }
        } else if (storedRefreshToken) {
          // No access token but refresh token exists — try to refresh
          const refreshed = await refreshAccessToken();
          if (cancelled) return;
          if (!refreshed) {
            clearSession();
          }
        }
      } catch {
        // Error handling is intentionally minimal
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [refreshAccessToken, clearSession]);

  // Periodic token refresh
  useEffect(() => {
    if (!refreshToken) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    return (): void => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [refreshToken, refreshAccessToken]);

  const login = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
  }> => {
    try {
      const response = await api.auth.login({ email, password });
      if (response.success && response.data) {
        await handleAuthResponse(response.data);
        return { success: true };
      } else {
        const r = response as {
          message?: string;
          code?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };
        return {
          success: false,
          message: r.message ?? response.message,
          code: r.code,
          fieldErrors: r.details?.fieldErrors,
        };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
  }> => {
    try {
      const response = await api.auth.register({
        displayName: name.trim(),
        email: email.trim(),
        password,
      });
      if (response.success && response.data) {
        await handleAuthResponse(response.data);
        return { success: true };
      } else {
        const r = response as {
          message?: string;
          code?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };
        return {
          success: false,
          message: r.message ?? response.message,
          code: r.code,
          fieldErrors: r.details?.fieldErrors,
        };
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
      clearSession();
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.user.getProfile();
      if (response.success && response.data) {
        const userData = response.data;
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
        setUser(userObj);
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        }
        const currentToken =
          typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
        if (currentToken) setAuthCookie(currentToken);
      }
    } catch (error) {
      webLogger.error('Failed to refresh user', error);
    }
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

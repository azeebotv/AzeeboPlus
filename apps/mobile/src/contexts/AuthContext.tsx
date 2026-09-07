import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authApi, userApi, apiClient, type User, type ApiResponse } from '../api';
import { useStorage } from '../hooks/useStorage';
import { useSecureStorage } from '../hooks/useSecureStorage';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<{ success: boolean; message?: string }>;
  socialLogin: (data: {
    code: string;
    state: string;
    displayName?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  resendOTP: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getItem, setItem, removeItem } = useStorage();
  const {
    getItem: getSecureItem,
    setItem: setSecureItem,
    removeItem: removeSecureItem,
  } = useSecureStorage();

  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Biometric authentication (Face ID / Fingerprint) is planned for sensitive operations
  // (logout, password changes, payment confirmations) using expo-local-authentication.
  // Currently handled via session timeout and re-authentication for critical flows.

  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    sessionTimerRef.current = setTimeout(async () => {
      logger.warn('Session timed out due to inactivity');
      await logout();
    }, SESSION_TIMEOUT_MS);
  }, [logout]);

  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Persist refreshed tokens so they survive app restarts
    apiClient.setOnRefreshCallback(async (tokens) => {
      await setSecureItem('accessToken', tokens.access_token);
      await setSecureItem('refreshToken', tokens.refresh_token);
    });
    checkAuth();
    return () => clearSessionTimer();
  }, []);

  useEffect(() => {
    if (user) {
      resetSessionTimer();
      return () => clearSessionTimer();
    }
    return undefined;
  }, [user, resetSessionTimer, clearSessionTimer]);

  // Pause session timeout when app is backgrounded to avoid false logout
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (!user) return;
      if (nextState === 'background') {
        clearSessionTimer();
      } else if (nextState === 'active') {
        resetSessionTimer();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, resetSessionTimer, clearSessionTimer]);

  const checkAuth = async () => {
    try {
      // SECURITY NOTE: User data is stored in AsyncStorage (not SecureStore) because
      // SecureStore has a 2KB size limit which is insufficient for the full user profile.
      // Tokens (accessToken, refreshToken) are stored in SecureStore since they are small.
      // Mitigation: XSS prevention via CSP headers is critical since AsyncStorage is
      // accessible to any JS running on the page. Consider encrypting user data if the
      // profile grows to include sensitive fields.
      const token = await getSecureItem('accessToken');
      const refreshToken = await getSecureItem('refreshToken');
      const userData = await getItem('user');

      // Intentionally skip token validation here for fast startup.
      // The first API call will trigger a 401 if the token is expired,
      // which the apiClient interceptor handles by refreshing or logging out.
      if (token && userData) {
        setUser(JSON.parse(userData));
        apiClient.setToken(token);
        apiClient.setRefreshToken(refreshToken);
      }
    } catch (error) {
      logger.error('Auth check failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthResponse = async (
    response: ApiResponse<{ access_token: string; refresh_token: string; user: User }>
  ) => {
    if (response.success && response.data) {
      const { access_token, refresh_token, user: userData } = response.data;
      // T-C06: Store tokens in secure storage, user profile in regular storage
      await setSecureItem('accessToken', access_token);
      await setSecureItem('refreshToken', refresh_token);
      await setItem('user', JSON.stringify(userData));
      apiClient.setToken(access_token);
      apiClient.setRefreshToken(refresh_token);
      setUser(userData);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        await handleAuthResponse(
          response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>
        );
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: unknown) {
      logger.error('Login error', error);
      const message = error instanceof Error ? error.message : 'An error occurred during login';
      return { success: false, message };
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const response = await authApi.register({ email, password, name, phone });
      if (response.success && response.data) {
        await handleAuthResponse(
          response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>
        );
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: unknown) {
      logger.error('Register error', error);
      const message =
        error instanceof Error ? error.message : 'An error occurred during registration';
      return { success: false, message };
    }
  };

  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      logger.error('Logout error', error);
    } finally {
      clearSessionTimer();
      await removeSecureItem('accessToken');
      await removeSecureItem('refreshToken');
      await removeItem('user');
      apiClient.setToken(null);
      setUser(null);
    }
  }

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email);
  };

  const verifyOTP = async (code: string) => {
    try {
      const response = await authApi.verifyOTP(code);
      if (response.success && response.data) {
        const data = response.data as { access_token: string; refresh_token: string; user: User };
        await handleAuthResponse(
          response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>
        );
        return { success: true, user: data.user };
      }
      return { success: false, message: response.message || 'OTP verification failed' };
    } catch (error: unknown) {
      logger.error('OTP verification error', error);
      const message =
        error instanceof Error ? error.message : 'An error occurred during OTP verification';
      return {
        success: false,
        message,
      };
    }
  };

  const socialLogin = async (data: { code: string; state: string; displayName?: string }) => {
    try {
      const response = await authApi.socialCallback(data);
      if (response.success && response.data) {
        await handleAuthResponse(
          response as ApiResponse<{ access_token: string; refresh_token: string; user: User }>
        );
        return { success: true };
      }
      return { success: false, message: response.message || 'Social login failed' };
    } catch (error: unknown) {
      logger.error('Social login error', error);
      const message =
        error instanceof Error ? error.message : 'An error occurred during social login';
      return { success: false, message };
    }
  };

  const resendOTP = async () => {
    await authApi.resendOTP();
  };

  const refreshUser = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        const userData = response.data as User;
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
        socialLogin,
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

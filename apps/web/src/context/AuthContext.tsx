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
import { api, User, AuthResponse } from '../lib/api';
import {
  setAuthCookie,
  refreshAuthCookie,
  clearAuthCookies,
  isAuthenticated as hasSessionMarker,
} from '../lib/cookie-utils';
import { webLogger } from '@/lib/logger';
import { AUTH_COOKIE } from '@/lib/cookie-names';

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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;
const REFRESH_TOKEN_KEY = 'azeebo_refresh_token';
const USER_KEY = 'azeebo_user';

interface ProfilePayload {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

function toUser(profile: ProfilePayload): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.displayName || profile.name || '',
    displayName: profile.displayName,
    role: profile.role,
    avatar: profile.avatar,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/** A failed profile read that says nothing about whether the session is valid. */
function isTransportFailure(statusCode?: number): boolean {
  return !statusCode || statusCode === 408 || statusCode === 429 || statusCode >= 500;
}

type SessionProbe = { user: User } | { rejected: true } | { transport: true };

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  // Whether the API has confirmed this browser's session. Deliberately separate
  // from `token`: the access token is httpOnly, so it is normally unreadable
  // here even for a perfectly valid session, and deriving authentication from
  // it logged every user out on a hard reload.
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSession = useCallback(async (): Promise<void> => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setSessionActive(false);
    api.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // The marker is the JS-visible half of the session. Expire it locally as
      // well: if the caller navigates before the server round-trip lands, the
      // boot probe must not read a still-valid marker and sign the user back in.
      document.cookie = `${AUTH_COOKIE}=; Max-Age=0; path=/; SameSite=Strict`;
    }
    // Awaited on purpose: the httpOnly token cookies can only be expired by
    // the server, and a logout that navigates away first can abort the request
    // before its Set-Cookie is applied — leaving a live session behind.
    await clearAuthCookies();
  }, []);

  const persistTokens = useCallback(
    async (accessToken: string, newRefreshToken: string, userData: User) => {
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      setSessionActive(true);
      api.setToken(accessToken);

      // AUD-03: Never persist refresh token in localStorage to eliminate XSS persistence.
      // Refresh token is persisted strictly via httpOnly cookie and kept in memory.
      if (typeof window !== 'undefined') {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }

      // Set access + refresh tokens in HttpOnly cookies via server API.
      // The refresh cookie is what lets lib/api/base.ts's cookie-first auth
      // recover apiFetch sessions after the 15-min access cookie expires.
      await setAuthCookie(accessToken, newRefreshToken);
    },
    []
  );

  /**
   * Rotates the access token through the in-memory refresh token, falling back
   * to the httpOnly refresh cookie. Deliberately does not clear the session on
   * failure — a failed rotation is not proof of a logged-out browser, and the
   * boot probe must keep the cached user across a transport blip.
   */
  const rotateTokens = useCallback(async (): Promise<boolean> => {
    try {
      const data = await api.attemptRefresh(refreshToken || undefined);
      if (data) {
        setToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setSessionActive(true);
        // Re-plant both cookies (access 15m + refresh 7d) after rotation.
        await refreshAuthCookie(data.access_token, data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const rotated = await rotateTokens();
    if (!rotated) await clearSession();
    return rotated;
  }, [rotateTokens, clearSession]);

  const handleAuthResponse = useCallback(
    async (response: AuthResponse) => {
      const { access_token, refresh_token, user: userData } = response;
      await persistTokens(access_token, refresh_token, userData);
    },
    [persistTokens]
  );

  // On mount, restore session from cookies/localStorage
  useEffect(() => {
    let cancelled = false;

    const loadSession = async (): Promise<void> => {
      try {
        // Both tokens live in httpOnly cookies set by /api/auth/set-cookie, so
        // neither is readable here. What survives a reload is the cached user
        // record plus the middleware session marker — those say whether this
        // browser ever signed in; only the API itself can say whether the
        // session is still valid.
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;

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

        if (!storedUser && !hasSessionMarker()) {
          // Nothing suggests this browser ever signed in. Stay anonymous
          // instead of firing a 401 probe on every cold page load.
          return;
        }

        const probeSession = async (): Promise<SessionProbe> => {
          try {
            // skipAuthRetry keeps a failed read from hard-redirecting the page:
            // recovery (or logout) is decided here from the status, not by the
            // client.
            const response = await api.user.getProfile({ skipAuthRetry: true });
            if (cancelled) return { transport: true };
            if (response.success && response.data) return { user: toUser(response.data) };
            return isTransportFailure(response.statusCode)
              ? { transport: true }
              : { rejected: true };
          } catch {
            return { transport: true };
          }
        };

        let result = await probeSession();

        if (!('user' in result) && !cancelled) {
          // The access cookie expires after 15 minutes while the httpOnly
          // refresh cookie is still valid, so a failed first read is the normal
          // case rather than a logged-out one. Rotate via the cookie and read
          // the profile again.
          const refreshed = await rotateTokens();
          if (cancelled) return;
          if (refreshed) result = await probeSession();
        }
        if (cancelled) return;

        if ('user' in result) {
          setUser(result.user);
          localStorage.setItem(USER_KEY, JSON.stringify(result.user));
          setSessionActive(true);
        } else if ('rejected' in result) {
          await clearSession();
        } else {
          // Transport failure says nothing about the session. Keep the cached
          // user and let the cookie-first refresh recover on the next request
          // instead of logging the user out over a blip.
          setSessionActive(true);
        }
      } catch {
        // Error handling is intentionally minimal
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [rotateTokens, clearSession]);

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

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login({ email, password });
      if (response.success && response.data) {
        await handleAuthResponse(response.data);
        return { success: true };
      }
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
    } catch {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.auth.register({
        displayName: name.trim(),
        email: email.trim(),
        password,
      });
      if (response.success && response.data) {
        await handleAuthResponse(response.data);
        return { success: true };
      }
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
    } catch {
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // The access token is httpOnly, so `token` is usually null even for a
      // live session; gating the server-side logout on it left the refresh
      // cookie valid and the next reload silently signed the user back in.
      if (sessionActive) await api.auth.logout();
    } catch {
      /* ignore */
    } finally {
      await clearSession();
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.user.getProfile();
      if (response.success && response.data) {
        const userObj = toUser(response.data);
        setUser(userObj);
        setSessionActive(true);
        if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(userObj));
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
    isAuthenticated: sessionActive && !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

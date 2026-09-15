import { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  type User,
  type AuthResponse,
  apiFetch,
  getToken,
  setAuthCookies,
  setUser as storeUser,
  getUser,
  clearSession,
  fetchCsrfToken,
} from '../lib/api/base';
import { AuthContext, type AuthContextType } from './auth-context';

// Re-exported for import-path compatibility; the canonical home of useAuth is
// ./auth-context (kept separate so this file exports only the provider
// component and vite Fast-Refresh stays enabled here).
export { useAuth } from './auth-context';
export type { AuthContextType } from './auth-context';

const ALLOWED_ROLES = new Set(['admin', 'superadmin']);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedUser = getUser();
      const storedToken = getToken();

      if (storedUser && storedToken) {
        if (ALLOWED_ROLES.has(storedUser.role)) {
          setUserState(storedUser);
          setIsLoading(false);
          return;
        }
        clearSession();
      }

      // httpOnly-cookie session: the tokens are invisible to JS, so a readable
      // token existing is NOT the test for a live session. Ask the server who
      // we are — apiFetch carries the cookies and, if the access token has
      // expired, transparently rotates it via /auth/refresh before retrying.
      try {
        const res = await apiFetch<{
          id: string;
          email: string;
          role: string;
          displayName?: string;
          avatar?: string;
        }>(`/api/v1/auth/me?_t=${Date.now()}`);

        const userData = res.data;
        if (res.success && userData?.id && ALLOWED_ROLES.has(userData.role)) {
          const restored: User = {
            id: userData.id,
            email: userData.email,
            name: userData.displayName || userData.email,
            displayName: userData.displayName,
            avatar: userData.avatar,
            role: userData.role,
          };
          storeUser(restored);
          setUserState(restored);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // apiFetch already attempted the refresh flow and cleared the
          // session on failure — nothing to recover here.
        }
      } catch {
        // Probe failed (offline/gateway down) — treat as logged out.
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiFetch<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuthRetry: true,
      } as RequestInit & { skipAuthRetry?: boolean });

      if (response.success && response.data) {
        const { access_token, refresh_token, user: userData } = response.data;

        if (!ALLOWED_ROLES.has(userData.role)) {
          return { success: false, message: 'Access denied. Admin privileges required.' };
        }

        setAuthCookies(access_token, refresh_token);
        storeUser(userData);
        setUserState(userData);
        await fetchCsrfToken();
        return { success: true };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch {
      return { success: false, message: 'An error occurred during login' };
    }
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    setUserState(null);
    window.location.href = '/login';
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && ALLOWED_ROLES.has(user.role),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

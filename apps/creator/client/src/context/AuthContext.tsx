import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type User, apiFetch, clearSession } from '../lib/api/base';
import { goToWebLogin } from '../lib/web-auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** A live web session that is not a creator. Distinct from "signed out" so the
   * hand-off page can explain it instead of bouncing the user into a login loop. */
  roleDenied: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ALLOWED_ROLES = new Set(['creator']);

interface SessionProfile {
  id: string;
  email: string;
  role: string;
  displayName?: string;
  avatar?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [roleDenied, setRoleDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const probeSession = async (): Promise<void> => {
      // Credentials belong to the main web app: this studio never collects a
      // password. The question here is only whether the platform-wide httpOnly
      // cookies already identify a creator — apiFetch carries them and rotates
      // an expired access token via /auth/refresh before answering, so a
      // readable token is deliberately not part of the test.
      try {
        const res = await apiFetch<SessionProfile>(`/api/v1/auth/me?_t=${Date.now()}`);
        if (cancelled) return;

        const profile = res.data;
        if (res.success && profile?.id) {
          if (ALLOWED_ROLES.has(profile.role)) {
            setUserState({
              id: profile.id,
              email: profile.email,
              name: profile.displayName || profile.email,
              displayName: profile.displayName,
              avatar: profile.avatar,
              role: profile.role,
            });
          } else {
            // Signed in to Azeebo+, just not as a creator.
            setRoleDenied(true);
          }
        }
      } catch {
        // Signed out, or the gateway is unreachable. Either way there is no
        // session to show, and the hand-off page retries on the next load.
      }
      if (!cancelled) setIsLoading(false);
    };

    probeSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    // The session is shared with the web app, so signing out here ends it
    // everywhere and hands the user back to the web sign-in page.
    setUserState(null);
    setRoleDenied(false);
    await clearSession();
    goToWebLogin('/');
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && ALLOWED_ROLES.has(user.role),
    roleDenied,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

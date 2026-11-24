import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { type User, apiFetch, clearSession } from '../lib/api/base';
import { goToWebLogin } from '../lib/web-auth';
import { AuthContext, type AuthContextType } from './auth-context';

// The canonical home of useAuth is ./auth-context (kept separate so this file
// exports only the provider component and vite Fast-Refresh stays enabled
// here); consumers keep importing it from this path.
export { useAuth } from './auth-context';

const ALLOWED_ROLES = new Set([
  'admin',
  'superadmin',
  'super_admin',
  'ADMIN',
  'SUPERADMIN',
  'SUPER_ADMIN',
]);

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
      // Credentials belong to the main web app: this panel never collects a
      // password. The question here is only whether the platform-wide httpOnly
      // cookies already identify an admin — apiFetch carries them and rotates
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
            // Signed in to Azeebo+, just not as an admin.
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

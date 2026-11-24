import { createContext, useContext } from 'react';
import type { User } from '../lib/api/base';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * A live web session that is not an admin. Distinct from "signed out" so the
   * hand-off page can explain it instead of bouncing the user into a login loop.
   */
  roleDenied: boolean;
  logout: () => Promise<void>;
}

/**
 * Context object + hook for the admin auth session — deliberately in a plain
 * module separate from AuthProvider (a .tsx file). vite-plugin-react
 * Fast-Refresh invalidates any file whose exports aren't exclusively
 * components; co-exporting the useAuth hook from AuthContext.tsx disabled
 * refresh there and stranded stale modules in open tabs (ghost crashes from
 * previous code generations).
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

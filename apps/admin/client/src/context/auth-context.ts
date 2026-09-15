import { createContext, useContext } from 'react';
import type { User } from '../lib/api/base';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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

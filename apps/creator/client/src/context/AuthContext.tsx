import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
        } else {
          clearSession();
        }
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
      });

      if (response.success && response.data) {
        const { access_token, refresh_token, user: userData } = response.data;

        if (!ALLOWED_ROLES.has(userData.role)) {
          return { success: false, message: 'Access denied. Creator account required.' };
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

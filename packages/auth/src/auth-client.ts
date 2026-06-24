/**
 * Shared AuthClient for centralized token management, refresh logic,
 * and 401 handling. Consumed by both web and mobile apps.
 *
 * This eliminates duplicated auth logic across frontends and provides
 * a single source of truth for authentication flows.
 */

/** Token storage adapter interface — implemented per-platform */
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  setRefreshToken(token: string): Promise<void>;
  clearTokens(): Promise<void>;
}

/** Auth configuration */
export interface AuthClientConfig {
  /** Base URL for the auth API (e.g., 'https://api.azeeboplus.com') */
  baseUrl: string;
  /** Token storage adapter */
  storage: TokenStorage;
  /** Maximum number of refresh retries before giving up */
  maxRefreshRetries?: number;
  /** Delay between refresh retries in ms */
  refreshRetryDelay?: number;
  /** Callback when user needs to be redirected to login */
  onUnauthorized?: () => void;
  /** Callback on successful token refresh */
  onTokenRefreshed?: (accessToken: string) => void;
}

/** API response wrapper matching RFC 7807 error envelope */
export interface AuthApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  code?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
}

/** Login request payload */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Register request payload */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Auth tokens returned from login/register/refresh */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** User profile from auth service */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  isVerified?: boolean;
}

/** Auth state */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Auth event types for logging */
export type AuthEventType =
  | 'login'
  | 'register'
  | 'logout'
  | 'refresh'
  | 'token_expired'
  | 'unauthorized'
  | 'mfa_required'
  | 'social_login';

/** Auth event for audit logging */
export interface AuthEvent {
  type: AuthEventType;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Centralized AuthClient class.
 *
 * Handles:
 * - Login / Register / Logout
 * - Token storage (via pluggable storage adapter)
 * - Automatic token refresh with retry + exponential backoff
 * - 401 interception with automatic redirect
 * - Auth event logging
 *
 * Usage:
 * ```typescript
 * import { AuthClient, createWebAuthClient } from '@azeebo/auth';
 *
 * const auth = createWebAuthClient({
 *   baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
 * });
 *
 * await auth.login({ email, password });
 * const user = await auth.getCurrentUser();
 * ```
 */
export class AuthClient {
  private config: Required<AuthClientConfig>;
  private refreshPromise: Promise<AuthApiResponse<AuthTokens>> | null = null;

  constructor(config: AuthClientConfig) {
    this.config = {
      maxRefreshRetries: 3,
      refreshRetryDelay: 1000,
      onUnauthorized: () => {},
      onTokenRefreshed: () => {},
      ...config,
    };
  }

  /**
   * Login with email/password.
   * Stores tokens automatically on success.
   */
  async login(
    request: LoginRequest,
  ): Promise<AuthApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>> {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (response.success && response.data) {
      await this.config.storage.setAccessToken(response.data.accessToken);
      await this.config.storage.setRefreshToken(response.data.refreshToken);
      this.logEvent('login', response.data.user.id);
    }

    return response;
  }

  /**
   * Register a new account.
   * Stores tokens automatically on success.
   */
  async register(
    request: RegisterRequest,
  ): Promise<AuthApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>> {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (response.success && response.data) {
      await this.config.storage.setAccessToken(response.data.accessToken);
      await this.config.storage.setRefreshToken(response.data.refreshToken);
      this.logEvent('register', response.data.user.id);
    }

    return response;
  }

  /**
   * Logout: clear tokens and notify server.
   */
  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors — clear tokens regardless
    }

    await this.config.storage.clearTokens();
    this.logEvent('logout');
  }

  /**
   * Get current user profile using stored access token.
   * Automatically refreshes token if expired (401).
   */
  async getCurrentUser(): Promise<AuthApiResponse<AuthUser>> {
    return this.requestWithAutoRefresh<AuthUser>('/users/me');
  }

  /**
   * Refresh the access token using the stored refresh token.
   * Deduplicates concurrent refresh attempts.
   */
  async refreshToken(): Promise<AuthApiResponse<AuthTokens>> {
    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Make an authenticated API request.
   * Automatically attaches the access token.
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<AuthApiResponse<T>> {
    const accessToken = await this.config.storage.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorBody.message || errorBody.detail || `HTTP ${response.status}`,
          error: errorBody.error || errorBody.title,
          statusCode: response.status,
          code: errorBody.code,
          details: errorBody.details,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
        statusCode: 0,
      };
    }
  }

  // --- Private helpers ---

  /**
   * Make a request that automatically refreshes on 401.
   */
  private async requestWithAutoRefresh<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<AuthApiResponse<T>> {
    const response = await this.request<T>(endpoint, options);

    if (response.statusCode === 401) {
      this.logEvent('token_expired');

      // Try to refresh
      const refreshResult = await this.refreshToken();
      if (refreshResult.success) {
        this.logEvent('refresh');
        // Retry the original request with new token
        return this.request<T>(endpoint, options);
      }

      // Refresh failed — user must re-authenticate
      this.logEvent('unauthorized');
      this.config.onUnauthorized();
      return response;
    }

    return response;
  }

  /**
   * Internal refresh implementation with retry logic.
   */
  private async _doRefresh(): Promise<AuthApiResponse<AuthTokens>> {
    const refreshToken = await this.config.storage.getRefreshToken();

    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token available',
        statusCode: 401,
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRefreshRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Refresh failed with status ${response.status}`);
        }

        const data = await response.json();
        const tokens: AuthTokens = {
          accessToken: data.accessToken || data.data?.accessToken,
          refreshToken: data.refreshToken || data.data?.refreshToken,
        };

        if (!tokens.accessToken) {
          throw new Error('No access token in refresh response');
        }

        // Store new tokens
        await this.config.storage.setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          await this.config.storage.setRefreshToken(tokens.refreshToken);
        }

        this.config.onTokenRefreshed(tokens.accessToken);

        return {
          success: true,
          data: tokens,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRefreshRetries) {
          const delay = this.config.refreshRetryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted — clear tokens
    await this.config.storage.clearTokens();

    return {
      success: false,
      message: lastError?.message || 'Token refresh failed after retries',
      statusCode: 401,
    };
  }

  /**
   * Log auth events for audit trail.
   */
  private logEvent(
    type: AuthEventType,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): void {
    const event: AuthEvent = {
      type,
      timestamp: new Date(),
      userId,
      metadata,
    };

    // Emit to console in development; in production this should
    // send to an analytics/audit endpoint
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Auth]', event);
    }
  }
}

/**
 * Factory function for creating an AuthClient with a simple in-memory storage.
 * Useful for testing or server-side rendering.
 */
export function createMemoryAuthClient(config: Omit<AuthClientConfig, 'storage'>): AuthClient {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  return new AuthClient({
    ...config,
    storage: {
      getAccessToken: async () => accessToken,
      getRefreshToken: async () => refreshToken,
      setAccessToken: async (token: string) => {
        accessToken = token;
      },
      setRefreshToken: async (token: string) => {
        refreshToken = token;
      },
      clearTokens: async () => {
        accessToken = null;
        refreshToken = null;
      },
    },
  });
}

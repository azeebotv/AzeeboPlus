// ApiClient – assembled from domain-specific modules
// Re-exports everything for backward compatibility with `import { api, apiFetch, ... } from '../lib/api'`

import { resolvedApiUrl, RETRY_CONFIG, gatewayPath } from './base';
import type { RetryOptions } from './base';
import { createAuthMethods } from './auth';
import { createUserMethods } from './user';
import { createContentMethods } from './content';
import { createRealityMethods } from './reality';
import { createWalletMethods } from './wallet';
import { createPaymentMethods } from './payment';
import { createRecommendationMethods } from './recommendation';
import { createUniverseMethods } from './universe';
import { createCreatorMethods } from './creator';
import { createModerationMethods } from './moderation';
import { createAdminMethods } from './admin';
import { createEngagementMethods } from './engagement';

import type { ApiResponse } from './base';

const ACCESS_TOKEN_KEY = 'azeebo_access_token';
const REFRESH_TOKEN_KEY = 'azeebo_refresh_token';
const USER_KEY = 'azeebo_user';

/** Set the middleware-readable auth cookie so protected routes don't redirect to login. */
function setAuthCookie(value: string, maxAge: number = 7 * 24 * 60 * 60): void {
  if (typeof document !== 'undefined') {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    document.cookie = `auth=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<import('./base').RefreshTokensResponse | null> | null = null;

  auth: ReturnType<typeof createAuthMethods>;
  user: ReturnType<typeof createUserMethods>;
  content: ReturnType<typeof createContentMethods>;
  reality: ReturnType<typeof createRealityMethods>;
  wallet: ReturnType<typeof createWalletMethods>;
  payment: ReturnType<typeof createPaymentMethods>;
  recommendation: ReturnType<typeof createRecommendationMethods>;
  universe: ReturnType<typeof createUniverseMethods>;
  creator: ReturnType<typeof createCreatorMethods>;
  moderation: ReturnType<typeof createModerationMethods>;
  admin: ReturnType<typeof createAdminMethods>;
  engagement: ReturnType<typeof createEngagementMethods>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Restore token from localStorage immediately so requests work
    // before AuthContext's useEffect runs (children effects fire first)
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (storedToken) {
        this.token = storedToken;
      }
    }

    // Wire up each domain, passing `this` as the request client
    this.auth = createAuthMethods(this);
    this.user = createUserMethods(this);
    this.content = createContentMethods(this);
    this.reality = createRealityMethods(this);
    this.wallet = createWalletMethods(this);
    this.payment = createPaymentMethods(this);
    this.recommendation = createRecommendationMethods(this);
    this.universe = createUniverseMethods(this);
    this.creator = createCreatorMethods(this);
    this.moderation = createModerationMethods(this);
    this.admin = createAdminMethods(this);
    this.engagement = createEngagementMethods(this);
  }

  setToken(token: string | null): void {
    this.token = token;
    // Keep localStorage in sync
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Deduplicates concurrent refresh attempts.
   * Returns the auth response on success, null on failure.
   */
  async attemptRefresh(): Promise<import('./base').RefreshTokensResponse | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async (): Promise<import('./base').RefreshTokensResponse | null> => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) return null;

        const response = await this.auth.refreshToken(refreshToken);
        if (response.success && response.data) {
          this.token = response.data.access_token;
          localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);

          // Update the middleware auth cookie
          const storedUser = localStorage.getItem(USER_KEY);
          if (storedUser) {
            setAuthCookie(JSON.parse(storedUser).id);
          }
          return response.data;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private calculateDelay(attempt: number, retryAfterHeader?: string | null): number {
    // T-M15: Respect Retry-After header from the server (clock-skew / rate-limit)
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, RETRY_CONFIG.maxDelayMs);
      }
    }
    const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelayMs);
  }

  private isRetryableError(statusCode?: number, error?: string): boolean {
    if (statusCode && RETRY_CONFIG.retryableStatusCodes.includes(statusCode)) {
      return true;
    }
    if (
      error === 'Network error. Please check your connection.' ||
      error === 'Request timeout. Please try again.'
    ) {
      return true;
    }
    return false;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOptions?: RetryOptions,
    attempt = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${gatewayPath(endpoint)}`;
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // T-C01: Send cookies for HttpOnly token support
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // T-CORE: On 401, attempt automatic token refresh and retry the request
        if (
          response.status === 401 &&
          !retryOptions?.skipAuthRetry &&
          !endpoint.includes('/auth/refresh') &&
          !endpoint.includes('/auth/login')
        ) {
          const refreshed = await this.attemptRefresh();
          if (refreshed) {
            // Retry the original request with the new token
            return this.request<T>(endpoint, options, retryOptions, attempt);
          }
          // Refresh failed — do NOT clear session here; let AuthContext handle cleanup
        }

        // T-M15: retry on standard retryable codes, but skip retry for auth/refresh
        // to prevent generating multiple refresh requests that hit rate limits
        const retryable =
          this.isRetryableError(response.status) && !endpoint.includes('/auth/refresh');

        if (retryable && attempt < RETRY_CONFIG.maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = this.calculateDelay(attempt, retryAfter);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryOptions, attempt + 1);
        }

        return {
          success: false,
          // RFC 7807 fields (passthrough from backend)
          type: data.type,
          title: data.title,
          status: response.status,
          detail: data.detail,
          instance: data.instance,
          // Application-level fields
          code: data.code,
          message:
            data.message ||
            (Array.isArray(data.error?.message)
              ? data.error.message.join(', ')
              : data.error?.message) ||
            data.detail ||
            'An error occurred',
          error: data.error,
          statusCode: response.status,
          details: data.details,
          timestamp: data.timestamp,
          path: data.path,
        } as any;
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryOptions, attempt + 1);
        }
        return {
          success: false,
          message: 'Request timeout. Please try again.',
          error: 'Request timeout',
          statusCode: 408,
        };
      }

      if (
        this.isRetryableError(undefined, error instanceof Error ? error.message : undefined) &&
        attempt < RETRY_CONFIG.maxRetries
      ) {
        const delay = this.calculateDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryOptions, attempt + 1);
      }

      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const api = new ApiClient(resolvedApiUrl);

// ---------------------------------------------------------------------------
// Re-export the standalone fetch helper
// ---------------------------------------------------------------------------

export { apiFetch, resolvedApiUrl } from './base';

// ---------------------------------------------------------------------------
// Re-export ALL types for backward compatibility
// ---------------------------------------------------------------------------

export type {
  ApiResponse,
  ApiError,
  RetryOptions,
  User,
  WalletBalance,
  Transaction,
  Wallet,
  ContentItem,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerifyResponse,
  RecommendationItem,
  Universe,
  Category,
  SearchFilters,
  PaginatedResponse,
  AnalyticsOverview,
} from './base';

export type {
  EngagementHistoryItem,
  UserUniverseEngagement,
  RecommendationGroup,
} from './engagement';

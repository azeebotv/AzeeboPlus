// ApiClient – assembled from domain-specific modules
// Re-exports everything for backward compatibility with `import { api, apiFetch, ... } from '../lib/api'`

import {
  resolvedApiUrl,
  RETRY_CONFIG,
  gatewayPath,
  generateCorrelationId,
  generateIdempotencyKey,
} from './base';
import type { RetryOptions } from './base';
import { createAuthMethods } from './auth';
import { createUserMethods } from './user';
import { createContentMethods } from './content';
import { createRealityMethods } from './reality';
import { createWalletMethods } from './wallet';
import { createBorrowMethods } from './borrow';
import { createPaymentMethods } from './payment';
import { createRecommendationMethods } from './recommendation';
import { createUniverseMethods } from './universe';
import { createCreatorMethods } from './creator';
import { createModerationMethods } from './moderation';

import { createEngagementMethods } from './engagement';
import { createBundleMethods } from './bundle';

import type { ApiResponse } from './base';
import type { ApiError } from './base';
import { createWebLogger } from '../logger';

const logger = createWebLogger('ApiClient');

const ACCESS_TOKEN_KEY = 'azeebo_access_token';
const REFRESH_TOKEN_KEY = 'azeebo_refresh_token';

/**
 * Plant the httpOnly refresh_token cookie (7 days) through a Next route.
 * lib/api/base.ts's cookie-first auth recovery POSTs /auth/refresh with no
 * body and relies on this cookie; without it, apiFetch-based pages 401
 * forever once the 15-min access cookie expires.
 */
export async function plantRefreshCookie(refreshToken: string): Promise<void> {
  if (typeof window === 'undefined' || !refreshToken) return;
  try {
    await fetch('/api/auth/refresh-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken, refresh_token: refreshToken }),
      credentials: 'include',
    });
  } catch {
    logger.error('Failed to plant refresh cookie via API');
  }
}

export async function setAuthCookie(value: string, maxAge: number = 30 * 60): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: value, maxAge }),
        credentials: 'include',
      });
    } catch {
      // SECURITY: Never use document.cookie fallback — it creates non-HttpOnly cookies
      // vulnerable to XSS. The /api/auth/cookie endpoint is the only way to set auth cookies.
      logger.error('Failed to set auth cookie via API');
    }
  }
}

export async function clearAuthCookie(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/cookie', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // SECURITY: Never use document.cookie fallback — it creates non-HttpOnly cookies
      // vulnerable to XSS. The /api/auth/cookie endpoint is the only way to clear auth cookies.
      logger.error('Failed to clear auth cookie via API');
    }
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<import('./base').RefreshTokensResponse | null> | null = null;

  auth: ReturnType<typeof createAuthMethods>;

  private buildErrorResponse(data: Record<string, unknown>, statusCode: number): ApiError {
    return {
      success: false,
      type: data.type as string,
      title: data.title as string,
      status: statusCode,
      detail: data.detail as string,
      instance: data.instance as string,
      code: data.code as string,
      message:
        (data.message as string) ||
        (Array.isArray((data.error as Record<string, unknown>)?.message)
          ? ((data.error as Record<string, unknown>).message as string[]).join(', ')
          : ((data.error as Record<string, unknown>)?.message as string)) ||
        (data.detail as string) ||
        'An error occurred',
      error: data.error,
      statusCode,
      details: data.details,
      timestamp: data.timestamp as string,
      path: data.path as string,
    } as ApiError;
  }
  user: ReturnType<typeof createUserMethods>;
  content: ReturnType<typeof createContentMethods>;
  reality: ReturnType<typeof createRealityMethods>;
  wallet: ReturnType<typeof createWalletMethods>;
  borrow: ReturnType<typeof createBorrowMethods>;
  payment: ReturnType<typeof createPaymentMethods>;
  recommendation: ReturnType<typeof createRecommendationMethods>;
  universe: ReturnType<typeof createUniverseMethods>;
  creator: ReturnType<typeof createCreatorMethods>;
  moderation: ReturnType<typeof createModerationMethods>;
  engagement: ReturnType<typeof createEngagementMethods>;
  bundle: ReturnType<typeof createBundleMethods>;

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
    this.borrow = createBorrowMethods(this);
    this.payment = createPaymentMethods(this);
    this.recommendation = createRecommendationMethods(this);
    this.universe = createUniverseMethods(this);
    this.creator = createCreatorMethods(this);
    this.moderation = createModerationMethods(this);
    this.engagement = createEngagementMethods(this);
    this.bundle = createBundleMethods(this);
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
  async attemptRefresh(
    explicitToken?: string
  ): Promise<import('./base').RefreshTokensResponse | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async (): Promise<import('./base').RefreshTokensResponse | null> => {
      try {
        const refreshToken =
          explicitToken ||
          (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null);

        // The refresh token lives only in an httpOnly cookie, so "JS cannot
        // read it" is the normal case, not a dead end. Falling back to the
        // cookie-only POST is what keeps a session alive past the 15-minute
        // access cookie; returning null here used to make every ApiClient 401
        // hard-redirect a still-valid user to the login page.
        const response = refreshToken
          ? await this.auth.refreshToken(refreshToken)
          : await this.auth.refreshToken();

        if (response.success && response.data) {
          this.token = response.data.access_token;
          localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
          // AUD-03: Sweep legacy refresh tokens from localStorage
          localStorage.removeItem(REFRESH_TOKEN_KEY);

          // Update the middleware auth cookie with the new access token,
          // and keep the httpOnly refresh cookie in sync with rotation so
          // the cookie-first recovery in lib/api/base.ts keeps working.
          setAuthCookie(response.data.access_token);
          void plantRefreshCookie(response.data.refresh_token);
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

    // Correlation ID for request tracing (TAA §9)
    if (!headers['x-correlation-id']) {
      headers['x-correlation-id'] = generateCorrelationId();
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Idempotency key for state-changing methods (TAA §9)
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = generateIdempotencyKey();
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
        // T-M15: When retryOn401 is set (e.g. refresh-token path), retry with
        // backoff instead of triggering a full auth refresh cycle.
        if (response.status === 401) {
          if (
            retryOptions?.retryOn401 &&
            attempt < RETRY_CONFIG.maxRetries &&
            !endpoint.includes('/auth/refresh') &&
            !endpoint.includes('/auth/login')
          ) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = this.calculateDelay(attempt, retryAfter);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.request<T>(endpoint, options, retryOptions, attempt + 1);
          }

          if (
            !retryOptions?.skipAuthRetry &&
            !endpoint.includes('/auth/refresh') &&
            !endpoint.includes('/auth/login')
          ) {
            const refreshed = await this.attemptRefresh();
            if (refreshed) {
              // Retry the original request with the new token
              return this.request<T>(endpoint, options, retryOptions, attempt);
            }
            // Refresh failed — redirect to login page
            if (typeof window !== 'undefined') {
              const loginUrl = new URL('/auth/login', window.location.origin);
              loginUrl.searchParams.set('redirect', window.location.pathname);
              window.location.href = loginUrl.toString();
            }
          }
        }

        // T-M15: retry on standard retryable codes, but skip retry for auth/refresh
        // to prevent generating multiple refresh requests that hit rate limits
        // T-M16: skipRetry option allows callers to fail immediately on server errors
        const retryable =
          !retryOptions?.skipRetry &&
          this.isRetryableError(response.status) &&
          !endpoint.includes('/auth/refresh');

        if (retryable && attempt < RETRY_CONFIG.maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = this.calculateDelay(attempt, retryAfter);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryOptions, attempt + 1);
        }

        return this.buildErrorResponse(data, response.status);
      }

      // T-FIX: Some upstream controllers return HTTP 200 with an error
      // envelope ({ success: false, ... }). Honor that instead of treating
      // the whole envelope as payload data (which broke pages calling
      // .find()/.map() on the result).
      if (
        data &&
        typeof data === 'object' &&
        'success' in data &&
        (data as Record<string, unknown>).success === false
      ) {
        return this.buildErrorResponse(data as Record<string, unknown>, response.status);
      }

      const body = data as Record<string, unknown>;
      return {
        success: true,
        data: body.data !== undefined ? body.data : data,
        message: body.message as string | undefined,
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
        this.isRetryableError(
          undefined,
          error instanceof Error ? (error as Error).message : undefined
        ) &&
        attempt < RETRY_CONFIG.maxRetries
      ) {
        const delay = this.calculateDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryOptions, attempt + 1);
      }

      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: error instanceof Error ? (error as Error).message : 'Unknown error',
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

export { apiFetch, resolvedApiUrl, generateIdempotencyKey } from './base';

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

export type { PartnerBankOffer } from './borrow';

// ApiClient – assembled from domain-specific modules
// Re-exports everything for backward compatibility with `import { api, apiFetch, ... } from '../lib/api'`

import { resolvedApiUrl, RETRY_CONFIG } from './base';
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

import type { ApiResponse } from './base';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

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
  }

  setToken(token: string | null): void {
    this.token = token;
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
    attempt = 0,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
        // T-M15: retry on standard retryable codes, AND on 401 when retryOn401 is set
        // (refresh-token path needs clock-skew resilience)
        const retryable =
          this.isRetryableError(response.status) ||
          (retryOptions?.retryOn401 === true && response.status === 401);

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
          message: data.message || data.detail || 'An error occurred',
          error: data.error,
          statusCode: response.status,
          details: data.details,
          timestamp: data.timestamp,
          path: data.path,
        };
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

export { apiFetch } from './base';

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

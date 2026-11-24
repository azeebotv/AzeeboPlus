// Shared types, configuration, and base utilities for the API client

import type {
  PlatformOverview,
  AdminWallet,
  AdminCreator,
  PaymentGateway,
  RealityShow,
  ContentReviewItem,
  EngagementMetrics,
  EngagementTrend,
  NotificationTemplate,
  NotificationStats,
  AdminReport,
  ReportMetric,
  ReportDimension,
  ReportFilter,
  AdminUniverse,
  FeatureFlag,
  SystemSetting,
} from '../admin-types';

// Re-export admin types so domain modules can import from base
export type {
  PlatformOverview,
  AdminWallet,
  AdminCreator,
  PaymentGateway,
  RealityShow,
  ContentReviewItem,
  EngagementMetrics,
  EngagementTrend,
  NotificationTemplate,
  NotificationStats,
  AdminReport,
  ReportMetric,
  ReportDimension,
  ReportFilter,
  AdminUniverse,
  FeatureFlag,
  SystemSetting,
};

// ---------------------------------------------------------------------------
// API base URL resolution
// ---------------------------------------------------------------------------

// NEXT_PUBLIC_API_BASE_URL is inlined at build time by Next.js.
// At runtime (server-side / standalone mode) it may be absent.
// Check both env var names for compatibility with different build configs.
// - Client-side: empty string works (relative URLs resolve via nginx proxy)
// - Server-side: fall back to localhost gateway for SSR / getServerSideProps
const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
export const resolvedApiUrl =
  envUrl || (typeof window === 'undefined' ? 'http://localhost:3013' : '');

// ---------------------------------------------------------------------------
// Retry configuration
// ---------------------------------------------------------------------------

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// ---------------------------------------------------------------------------
// Core interfaces
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * RFC 7807 (Problem Details for HTTP APIs) error envelope.
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ApiError {
  success: false;

  // --- RFC 7807 fields ---
  type?: string; // A URI reference that identifies the problem type
  title?: string; // A short, human-readable summary of the problem type
  status?: number; // HTTP status code (alias for statusCode)
  detail?: string; // A human-readable explanation specific to this occurrence
  instance?: string; // A URI reference that identifies the specific occurrence

  // --- Application-level fields ---
  code?: string; // Application-specific error code (e.g. "EMAIL_ALREADY_EXISTS")
  message: string; // Human-readable message (primary, always present)
  error?: string; // Legacy error string for backward compat
  statusCode?: number; // Legacy status code for backward compat
  details?: {
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  timestamp?: string; // ISO 8601 timestamp of the error
  path?: string; // Request path that caused the error
}

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  pendingBalance?: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  universeId: string;
  status: 'draft' | 'processing' | 'published' | 'archived';
  contentType?: string;
  duration?: number;
  views?: number;
  likes?: number;
  comments?: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  universe: {
    id: string;
    name: string;
    icon?: string;
  };
  mediaAsset?: {
    id: string;
    originalUrl: string;
    thumbnailUrl?: string;
    type: string;
    size: number;
  };
  categories?: {
    id: string;
    name: string;
  }[];
  tags?: {
    id: string;
    name: string;
  }[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokensResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface PaymentInitRequest {
  amount: number;
  currency: string;
  email: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitResponse {
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
}

export interface PaymentVerifyResponse {
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  reference: string;
  transactionId?: string;
}

export interface RecommendationItem {
  id: string;
  score: number;
  reason: string;
  content: ContentItem;
}

export interface Universe {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  contentCount?: number;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  contentCount?: number;
}

export interface SearchFilters {
  query?: string;
  universeId?: string;
  categoryId?: string;
  tags?: string[];
  yearFrom?: number;
  yearTo?: number;
  ratingFrom?: number;
  ratingTo?: number;
  sortBy?: 'relevance' | 'newest' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AnalyticsUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AnalyticsContent {
  id: string;
  title: string;
  views: number;
  likes: number;
  shares: number;
}

export interface AnalyticsRevenue {
  date: string;
  amount: number;
  currency: string;
}

export interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
}

export interface AnalyticsOverview {
  users: AnalyticsUser[];
  content: AnalyticsContent[];
  revenue: AnalyticsRevenue[];
}

/**
 * Options that control retry behaviour on a per-request basis.
 * T-M15: retryOn401 enables clock-skew resilience on the refresh-token path.
 */
export interface RetryOptions {
  /** Retry on HTTP 401 (useful for refresh-token clock-skew resilience) */
  retryOn401?: boolean;
  /** Skip the automatic 401 refresh handling in ApiClient (caller handles refresh itself) */
  skipAuthRetry?: boolean;
  /** Skip retrying on server errors (5xx) — fail immediately */
  skipRetry?: boolean;
}

// ---------------------------------------------------------------------------
// Request client interface – consumed by every domain module
// ---------------------------------------------------------------------------

export interface RequestClient {
  request<T>(
    endpoint: string,
    options?: RequestInit,
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>>;
}

// ---------------------------------------------------------------------------
// Standalone apiFetch helper (auth via HttpOnly cookies)
// ---------------------------------------------------------------------------

// Ensure endpoint routes through the gateway's /api prefix
export function gatewayPath(endpoint: string): string {
  if (endpoint.startsWith('/api/')) return endpoint;
  if (endpoint.startsWith('/v1/')) return `/api${endpoint}`;
  return `/api/v1${endpoint}`;
}

// ---------------------------------------------------------------------------
// Request correlation & idempotency (TAA §9)
// ---------------------------------------------------------------------------

let correlationCounter = 0;

/** Generate a unique correlation ID for request tracing */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (++correlationCounter).toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}-${counter}-${random}`;
}

/** Generate a UUID v4 idempotency key for mutations */
export function generateIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** HTTP methods that should receive idempotency keys */
const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Build standard headers for a request */
export function buildRequestHeaders(
  options: RequestInit,
  token: string | null
): Record<string, string> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  // Correlation ID for request tracing
  headers['x-correlation-id'] = generateCorrelationId();

  // Auth token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Idempotency key for state-changing methods
  const method = (options.method || 'GET').toUpperCase();
  if (IDEMPOTENT_METHODS.has(method) && !headers['Idempotency-Key']) {
    headers['Idempotency-Key'] = generateIdempotencyKey();
  }

  return headers;
}

const ACCESS_TOKEN_KEY = 'azeebo_access_token';
const REFRESH_TOKEN_KEY = 'azeebo_refresh_token';
const USER_KEY = 'azeebo_user';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = '_csrf';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Cookie-first auth for the web client. The access token rotates on every
 * /auth/refresh, so any localStorage copy goes stale the first time the
 * cookie flow recovers a session — attaching that stale Bearer header then
 * makes the backend 401 the request even though the fresh cookie is also
 * being sent. Only a token readable from the cookie jar is fresh by
 * construction, so only that may be mirrored into the header.
 */
function getCookieToken(): string | null {
  return getCookie('access_token');
}

/**
 * Single-flight refresh: N parallel 401s must trigger ONE refresh, not N.
 * Concurrent refreshes race the server-side token rotation — the losers
 * 401/429 and force a bogus logout (seen as logout-on-reload when the page
 * fires several queries at boot).
 */
let refreshInFlight: Promise<boolean> | null = null;
let cachedCsrfToken: string | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${resolvedApiUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => {
          refreshInFlight = null;
        }, 50);
      });
  }
  return refreshInFlight;
}

function resolveCsrfToken(): string | null {
  return cachedCsrfToken || getCookie(CSRF_COOKIE);
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/auth/csrf`, {
      credentials: 'include',
    });
    const headerToken = res.headers.get(CSRF_HEADER) || res.headers.get('x-csrf-token');
    const cookieToken = getCookie(CSRF_COOKIE);
    const token = headerToken || cookieToken;
    if (token) {
      cachedCsrfToken = token;
      if (typeof document !== 'undefined') {
        document.cookie = `${CSRF_COOKIE}_client=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
      }
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * CSRF recovery: the gateway mints tokens with an in-memory secret, so its
 * secret rotates on restart and every cached token instantly goes stale. A
 * mutation then 403s ("CSRF token missing/mismatch") forever because the
 * cached token short-circuits re-bootstrap. On a CSRF-flavored 403, drop the
 * cache, expire the cookies, re-bootstrap once, and retry the mutation with
 * the fresh token. Single-flight so parallel mutations share one recovery.
 */
let csrfRecoveryInFlight: Promise<string | null> | null = null;

function recoverCsrfToken(): Promise<string | null> {
  if (!csrfRecoveryInFlight) {
    csrfRecoveryInFlight = (async () => {
      cachedCsrfToken = null;
      if (typeof document !== 'undefined') {
        document.cookie = `${CSRF_COOKIE}=; Max-Age=0; path=/`;
        document.cookie = `${CSRF_COOKIE}_client=; Max-Age=0; path=/`;
      }
      return fetchCsrfToken();
    })().finally(() => {
      setTimeout(() => {
        csrfRecoveryInFlight = null;
      }, 50);
    });
  }
  return csrfRecoveryInFlight;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { skipAuthRetry?: boolean } = {},
  retryOptions?: { maxRetries?: number; timeoutMs?: number }
): Promise<ApiResponse<T>> {
  const maxRetries = retryOptions?.maxRetries ?? 0;
  const timeoutMs = retryOptions?.timeoutMs ?? 15000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Correlation ID for request tracing
  if (!headers['x-correlation-id']) {
    headers['x-correlation-id'] = generateCorrelationId();
  }

  // Cookie-first: mirror the header only from the cookie token (always
  // fresh); never from the localStorage copy, which goes stale on rotation.
  const cookieToken = getCookieToken();
  if (cookieToken) {
    headers['Authorization'] = `Bearer ${cookieToken}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  if (STATE_CHANGING_METHODS.includes(method)) {
    // Bootstrap when no token is cached: the gateway only mints the _csrf
    // cookie on bootstrap, so a cold page would otherwise send cookieless
    // mutations that the backend must reject.
    let csrfToken = resolveCsrfToken();
    if (!csrfToken) {
      csrfToken = await fetchCsrfToken();
    }
    if (csrfToken) {
      headers[CSRF_HEADER] = csrfToken;
    }
    // Idempotency key for state-changing methods
    if (!headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = generateIdempotencyKey();
    }
  }

  let lastError: Error | null = null;
  // The 401-recovery retry must not consume the transport-retry budget: with
  // the default maxRetries=0 the recovery would otherwise exit the loop and
  // surface as "Network error" instead of the silently-refreshed request.
  let authRecoveryUsed = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${resolvedApiUrl}${gatewayPath(endpoint)}`, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 — refresh via the httpOnly refresh_token cookie. The
        // browser sends it automatically and the backend rotates + resets the
        // cookies itself, so no body token is needed (a localStorage copy of
        // the refresh token would be stale after the first rotation anyway).
        // Single-flight so parallel 401s share one rotation; retry only on
        // the first attempt so a persistent 401 still returns the error.
        if (response.status === 401 && !options.skipAuthRetry) {
          if (!authRecoveryUsed) {
            authRecoveryUsed = true;
            const refreshed = await refreshSession();
            if (refreshed) {
              // Mirror the retry header from the (now fresh) cookie token
              // only; the pre-refresh header, if any, is stale and must not
              // be reused or the backend would 401 the retry forever.
              const retryCookieToken = getCookieToken();
              if (retryCookieToken) {
                headers['Authorization'] = `Bearer ${retryCookieToken}`;
              } else {
                delete headers['Authorization'];
                delete headers['authorization'];
              }
              attempt -= 1; // recovery retry is free; keep the retry budget
              continue; // Retry with the fresh cookie/header
            }
          }
          // Refresh failed or no refresh token — clear session
          if (typeof window !== 'undefined') {
            const hadSession = !!localStorage.getItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);

            if (hadSession && !window.location.pathname.startsWith('/auth/')) {
              window.location.href = '/auth/expired-session';
            }
          }
          return {
            success: false,
            status: 401,
            message: 'Session expired. Please login again.',
            statusCode: 401,
          } as ApiError;
        }

        // CSRF-flavored 403: the gateway's in-memory secret rotated (restart)
        // and our cached token is dead. Re-bootstrap once and retry the
        // mutation with the fresh token instead of failing the user's action.
        if (
          response.status === 403 &&
          !options.skipAuthRetry &&
          /csrf/i.test(String(data?.error || data?.message || data?.title || ''))
        ) {
          const freshToken = await recoverCsrfToken();
          if (freshToken) {
            const retryResponse = await fetch(`${resolvedApiUrl}${gatewayPath(endpoint)}`, {
              ...options,
              headers: { ...headers, [CSRF_HEADER]: freshToken },
              credentials: 'include',
              signal: controller.signal,
            });
            const retryData = await retryResponse.json().catch(() => null);
            if (retryResponse.ok) {
              return {
                success: true,
                data: retryData && retryData.data !== undefined ? retryData.data : retryData,
                message: retryData?.message,
              };
            }
            return {
              success: false,
              message:
                (retryData && (retryData.message || retryData.detail)) ||
                data?.message ||
                'Request failed',
              statusCode: retryResponse.status,
            } as ApiError;
          }
        }

        // Rate limit handling (429) — respect Retry-After header
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter && attempt < maxRetries) {
            const delay = Math.min(parseInt(retryAfter, 10) * 1000, 10000);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          return {
            success: false,
            type: data.type,
            title: data.title || 'Rate Limited',
            status: 429,
            detail: data.detail || 'Too many requests. Please try again later.',
            code: 'RATE_LIMITED',
            message: data.message || `Rate limited. Retry after ${retryAfter || '60'}s`,
            statusCode: 429,
          } as ApiError;
        }

        // Don't retry on other client errors (4xx except 408)
        if (response.status >= 400 && response.status < 500 && response.status !== 408) {
          return {
            success: false,
            type: data.type,
            title: data.title,
            status: response.status,
            detail: data.detail,
            instance: data.instance,
            code: data.code,
            message: data.message || data.detail || 'An error occurred',
            error: data.error,
            statusCode: response.status,
            details: data.details,
            timestamp: data.timestamp,
            path: data.path,
          } as ApiError;
        }

        // Retry on retryable server errors
        if (attempt < maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? Math.min(parseInt(retryAfter, 10) * 1000, 5000)
            : Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          success: false,
          type: data.type,
          title: data.title,
          status: response.status,
          detail: data.detail,
          instance: data.instance,
          code: data.code,
          message: data.message || data.detail || 'An error occurred',
          error: data.error,
          statusCode: response.status,
          details: data.details,
          timestamp: data.timestamp,
          path: data.path,
        } as ApiError;
      }

      // T-FIX: Some upstream controllers return HTTP 200 with an error
      // envelope ({ success: false, ... }). Honor it instead of treating
      // the whole envelope as payload data (which broke pages calling
      // .find()/.map() on the result).
      if (data && typeof data === 'object' && data.success === false) {
        return {
          success: false,
          type: data.type,
          title: data.title,
          status: response.status,
          detail: data.detail,
          instance: data.instance,
          code: data.code,
          message: data.message || data.detail || 'An error occurred',
          error: data.error,
          statusCode: response.status,
          details: data.details,
          timestamp: data.timestamp,
          path: data.path,
        } as ApiError;
      }

      return {
        success: true,
        data: data.data !== undefined ? data.data : data,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort (user cancelled) or if max retries reached
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
          error: 'Request timeout',
          statusCode: 408,
        } as ApiError;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return {
    success: false,
    message: 'Network error. Please check your connection.',
    error: lastError?.message || 'Unknown error',
    statusCode: 0,
  } as ApiError;
}

// ---------------------------------------------------------------------------
// RFC 9457 Problem Details — strict type definitions
// @see https://datatracker.ietf.org/doc/html/rfc9457
// ---------------------------------------------------------------------------

/**
 * RFC 9457 Problem Details object.
 * This is a strict superset of RFC 7807 with the addition of:
 * - `errors` array for structured validation errors (§3)
 * - `extensions` support for arbitrary additional members
 */
export interface ProblemDetails {
  /** URI reference identifying the problem type (§3.1) */
  type: string;
  /** Short human-readable summary of the problem type (§3.2) */
  title: string;
  /** HTTP status code generated by the origin server (§3.3) */
  status: number;
  /** Human-readable explanation specific to this occurrence (§3.4) */
  detail?: string;
  /** URI reference identifying the specific occurrence (§3.5) */
  instance?: string;
  /** Structured validation errors (RFC 9457 §3 / extension) */
  errors?: ValidationError[];
  /** Application-specific error code */
  code?: string;
  /** Additional extension members */
  [key: string]: unknown;
}

/**
 * Validation error entry for structured field-level errors.
 */
export interface ValidationError {
  /** Dot-notation path to the field that failed validation */
  path: string;
  /** The validation rule that failed (e.g. "required", "minLength") */
  rule: string;
  /** Human-readable message for this field error */
  message: string;
  /** The rejected value (optional, for debugging) */
  rejected?: unknown;
}

/**
 * Parse an HTTP response into a ProblemDetails object.
 * Falls back to a generic problem if the response body is not valid JSON.
 */
export async function parseProblemDetails(response: Response): Promise<ProblemDetails> {
  const contentType = response.headers.get('content-type') || '';
  let body: Record<string, unknown>;

  if (
    !contentType.includes('application/json') &&
    !contentType.includes('application/problem+json')
  ) {
    return {
      type: 'about:blank',
      title: 'Bad Response',
      status: response.status,
      detail: `Server returned ${response.status} with non-JSON content-type: ${contentType || 'unknown'}`,
    };
  }

  try {
    body = await response.json();
  } catch {
    // Response body is not JSON — synthesise a problem
    return {
      type: 'about:blank',
      title: 'Bad Response',
      status: response.status,
      detail: `Server returned ${response.status} with non-JSON body`,
    };
  }

  // If the server already sends RFC 9457 fields, pass them through
  if (body.type && body.title) {
    const problem: ProblemDetails = {
      type: body.type as string,
      title: body.title as string,
      status: (body.status as number) ?? response.status,
    };
    if (body.detail) problem.detail = body.detail as string;
    if (body.instance) problem.instance = body.instance as string;
    if (body.errors) problem.errors = body.errors as ValidationError[];
    if (body.code) problem.code = body.code as string;

    // Carry through any extension members
    for (const [key, value] of Object.entries(body)) {
      if (!['type', 'title', 'status', 'detail', 'instance', 'errors', 'code'].includes(key)) {
        problem[key] = value;
      }
    }
    return problem;
  }

  // Server did not send RFC 9457 — synthesise from whatever we got
  const status = response.status;
  const code = (body.code as string) || deriveProblemCode(status);

  return {
    type: `https://api.azeebo.com/problems/${code}`,
    title: deriveProblemTitle(status),
    status,
    detail: (body.detail as string) || (body.message as string) || (body.error as string),
    code,
  };
}

/** Derive an application error code from HTTP status */
function deriveProblemCode(status: number): string {
  const map: Record<number, string> = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };
  return map[status] ?? 'ERROR';
}

/** Derive a human-readable title from HTTP status */
function deriveProblemTitle(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthenticated',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return map[status] ?? 'Error';
}

/**
 * Assert that a ProblemDetails response represents a specific problem type.
 * Throws if the problem type does not match.
 */
export function assertProblemType(problem: ProblemDetails, expectedType: string): void {
  if (problem.type !== expectedType && !problem.type.endsWith(`/${expectedType}`)) {
    throw new Error(`Expected problem type "${expectedType}" but got "${problem.type}"`);
  }
}

/**
 * Check if a ProblemDetails response is retryable (5xx or specific 4xx).
 */
export function isRetryableProblem(problem: ProblemDetails): boolean {
  const retryable = new Set([408, 429, 500, 502, 503, 504]);
  return retryable.has(problem.status);
}

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL is required — set it in .env.local or environment variables'
  );
}
export const resolvedApiUrl = API_BASE_URL;

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

const ACCESS_TOKEN_KEY = 'azeebo_access_token';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = '_csrf';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  if (STATE_CHANGING_METHODS.includes(method)) {
    const csrfToken = getCookie(CSRF_COOKIE);
    if (csrfToken) {
      headers[CSRF_HEADER] = csrfToken;
    }
  }

  try {
    const response = await fetch(`${resolvedApiUrl}${gatewayPath(endpoint)}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
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
      } as ApiError;
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? (error as Error).message : 'Unknown error',
      statusCode: 0,
    } as ApiError;
  }
}

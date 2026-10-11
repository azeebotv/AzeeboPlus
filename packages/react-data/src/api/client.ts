import Constants from 'expo-constants';
import { certificatePinningService } from '../utils/certificatePinning';
import { logger } from '../utils/logger';

// Ensure endpoint routes through the gateway's /api prefix
export function gatewayPath(endpoint: string): string {
  if (endpoint.startsWith('/api/')) return endpoint;
  if (endpoint.startsWith('/v1/')) return `/api${endpoint}`;
  return `/api/v1${endpoint}`;
}

/**
 * Uniqueness token for the Idempotency-Key header on mutating requests
 * (mirrors @azeebo/http-client). Uniqueness only — not a secret — so a
 * Math.random v4 is fine, and Hermes has no crypto.randomUUID.
 */
function generateIdempotencyKey(): string {
  return 'idemp-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ApiClientConfig {
  baseURL: string;
  token: string | null;
}

/**
 * RFC 7807 (Problem Details for HTTP APIs) error envelope.
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 *
 * Matches the web frontend and shared error-handling package interfaces.
 */
interface ApiError extends Error {
  // --- RFC 7807 fields ---
  type?: string; // A URI reference that identifies the problem type
  title?: string; // A short, human-readable summary of the problem type
  status?: number; // HTTP status code
  detail?: string; // A human-readable explanation specific to this occurrence
  instance?: string; // A URI reference that identifies the specific occurrence

  // --- Application-level fields ---
  code?: string; // Application-specific error code (e.g. "EMAIL_ALREADY_EXISTS")
  error?: string; // Legacy error string for backward compat
  statusCode?: number; // Legacy status code for backward compat
  details?: {
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  timestamp?: string; // ISO 8601 timestamp of the error
  path?: string; // Request path that caused the error
  data?: unknown; // Raw response body for diagnostics
}

class ApiClientClass {
  private config: ApiClientConfig = {
    baseURL:
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      (
        ((Constants as Record<string, unknown>).expoConfig as Record<string, unknown>)?.extra as
          | Record<string, string>
          | undefined
      )?.apiBaseURL ||
      (__DEV__ ? 'http://localhost:3013' : 'https://api.azeeboplus.com'),
    token: null,
  };
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private onRefreshCallback:
    | ((tokens: { access_token: string; refresh_token: string }) => void)
    | null = null;
  private onRefreshFailureCallback: (() => void) | null = null;

  setToken(token: string | null): void {
    this.config.token = token;
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }

  setOnRefreshCallback(
    callback: (tokens: { access_token: string; refresh_token: string }) => void
  ): void {
    this.onRefreshCallback = callback;
  }

  /** Invoked when a 401-triggered token refresh definitively fails, so the
   * auth layer can clear the dead session instead of leaving the UI signed in
   * with unusable tokens. */
  setOnRefreshFailureCallback(callback: () => void): void {
    this.onRefreshFailureCallback = callback;
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  getToken(): string | null {
    return this.config.token;
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      // The main request path aborts at 30s, but refresh previously ran with
      // no timeout at all — a hung gateway would stall the 401 error path (and
      // TV's device-auth poll loop) indefinitely. Bound it.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await certificatePinningService.fetchWithPinning(
          `${this.config.baseURL}/api/v1/auth/refresh`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            this.config.token = data.data.access_token;
            this.refreshToken = data.data.refresh_token;
            this.onRefreshCallback?.({
              access_token: data.data.access_token,
              refresh_token: data.data.refresh_token,
            });
            return true;
          }
        }
        this.onRefreshFailureCallback?.();
        return false;
      } catch (error) {
        logger.error('Token refresh failed:', error);
        this.onRefreshFailureCallback?.();
        return false;
      } finally {
        clearTimeout(timeoutId);
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${this.config.baseURL}${gatewayPath(endpoint)}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.config.token}`;
    }

    // Services guard money mutations with IdempotencyGuard — always send a key
    // so client-side retries dedupe instead of double-charging.
    if (
      method !== 'GET' &&
      method !== 'DELETE' &&
      method !== 'HEAD' &&
      !(headers as Record<string, string>)['Idempotency-Key']
    ) {
      (headers as Record<string, string>)['Idempotency-Key'] = generateIdempotencyKey();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await certificatePinningService.fetchWithPinning(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Attempt token refresh on 401 (Unauthorized)
        if (response.status === 401 && !isRetry && this.refreshToken) {
          const refreshed = await this.attemptTokenRefresh();
          if (refreshed) {
            return this.request<T>(method, endpoint, body, options, true);
          }
        }

        const error: ApiError = new Error(
          (data as { message?: string; detail?: string })?.message ||
            (data as { detail?: string })?.detail ||
            'An error occurred'
        );
        // RFC 7807 fields
        error.status = response.status;
        error.type = (data as { type?: string })?.type;
        error.title = (data as { title?: string })?.title;
        error.detail = (data as { detail?: string })?.detail;
        error.instance = (data as { instance?: string })?.instance;
        // Application-level fields
        error.code = (data as { code?: string })?.code;
        error.error = (data as { error?: string })?.error;
        error.statusCode = response.status;
        error.details = (data as { details?: ApiError['details'] })?.details;
        error.timestamp = (data as { timestamp?: string })?.timestamp;
        error.path = (data as { path?: string })?.path;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error('Request timeout. Please try again.');
        timeoutError.status = 408;
        throw timeoutError;
      }

      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      const networkError: ApiError = new Error('Network error. Please check your connection.');
      networkError.status = 0;
      throw networkError;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseURL}${gatewayPath(endpoint)}`;

    const headers: HeadersInit = {
      ...options?.headers,
    };

    if (this.config.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.config.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await certificatePinningService.fetchWithPinning(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error: ApiError = new Error(
          (data as { message?: string; detail?: string })?.message ||
            (data as { detail?: string })?.detail ||
            'Upload failed'
        );
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error('Upload timeout. Please try again.');
        timeoutError.status = 408;
        throw timeoutError;
      }

      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      const networkError: ApiError = new Error('Network error. Please check your connection.');
      networkError.status = 0;
      throw networkError;
    }
  }
}

export const apiClient = new ApiClientClass();

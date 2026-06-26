import Constants from 'expo-constants';
import { certificatePinningService } from '../utils/certificatePinning';

// Ensure endpoint routes through the gateway's /api prefix
export function gatewayPath(endpoint: string): string {
  if (endpoint.startsWith('/api/')) return endpoint;
  if (endpoint.startsWith('/v1/')) return `/api${endpoint}`;
  return `/api/v1${endpoint}`;
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
  type?: string;         // A URI reference that identifies the problem type
  title?: string;        // A short, human-readable summary of the problem type
  status?: number;       // HTTP status code
  detail?: string;       // A human-readable explanation specific to this occurrence
  instance?: string;     // A URI reference that identifies the specific occurrence

  // --- Application-level fields ---
  code?: string;         // Application-specific error code (e.g. "EMAIL_ALREADY_EXISTS")
  error?: string;        // Legacy error string for backward compat
  statusCode?: number;   // Legacy status code for backward compat
  details?: {
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  timestamp?: string;    // ISO 8601 timestamp of the error
  path?: string;         // Request path that caused the error
  data?: unknown;        // Raw response body for diagnostics
}

class ApiClientClass {
  private config: ApiClientConfig = {
    baseURL:
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      Constants.expoConfig?.extra?.apiBaseURL ||
      (__DEV__ ? 'http://localhost:3013' : 'http://api-gateway:3013'),
    token: null,
  };

  setToken(token: string | null): void {
    this.config.token = token;
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  getToken(): string | null {
    return this.config.token;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${gatewayPath(endpoint)}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.config.token}`;
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
    } catch (error: unknown) {
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
}

export const apiClient = new ApiClientClass();

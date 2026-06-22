import Constants from 'expo-constants';
import { certificatePinningService } from '../utils/certificatePinning';

interface ApiClientConfig {
  baseURL: string;
  token: string | null;
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
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
    const url = `${this.config.baseURL}${endpoint}`;

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
          (data as { message?: string })?.message || 'An error occurred'
        );
        error.status = response.status;
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

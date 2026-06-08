import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { ApiResponse } from '@azeebo/shared-types';

export interface TokenStorage {
  get: () => string | null;
  set: (token: string) => void;
  remove: () => void;
}

class LocalStorageTokenStorage implements TokenStorage {
  private readonly storageKey: string;

  constructor(storageKey: string = 'auth_token') {
    this.storageKey = storageKey;
  }

  get(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  set(token: string): void {
    localStorage.setItem(this.storageKey, token);
  }

  remove(): void {
    localStorage.removeItem(this.storageKey);
  }
}

interface RetryConfig {
  retries: number;
  delay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  tokenStorage?: TokenStorage;
  authStorageKey?: string;
  defaultHeaders?: Record<string, string>;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  delay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

function generateIdempotencyKey(): string {
  return `idemp-${Date.now()}-${randomUUID()}`;
}

function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.delay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private tokenStorage: TokenStorage;
  private retryConfig: RetryConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };

    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retryConfig,
    };

    if (this.config.tokenStorage) {
      this.tokenStorage = this.config.tokenStorage;
    } else {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        throw new Error(
          'ApiClient: tokenStorage is required in production. Please provide a secure storage implementation.'
        );
      }
      console.warn(
        'ApiClient: Using localStorage for token storage is not secure for production.'
      );
      this.tokenStorage = new LocalStorageTokenStorage(this.config.authStorageKey);
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.defaultHeaders,
      },
    });

    this.client.interceptors.request.use(
      (reqConfig) => {
        const token = this.tokenStorage.get();
        if (token) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        if (!reqConfig.headers['Idempotency-Key']) {
          reqConfig.headers['Idempotency-Key'] = generateIdempotencyKey();
        }
        if (!reqConfig.headers['X-Request-Id']) {
          reqConfig.headers['X-Request-Id'] = generateIdempotencyKey().replace('idemp-', 'req-');
        }
        return reqConfig;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.tokenStorage.remove();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('get', url, config);
  }

  async post<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('post', url, { data, ...config });
  }

  async put<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('put', url, { data, ...config });
  }

  async patch<T>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('patch', url, { data, ...config });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('delete', url, config);
  }

  private async requestWithRetry<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retryConfig.retries; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.client({
          method,
          url,
          ...config,
        });

        return {
          success: true,
          data: response.data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        lastError = error as Error;

        const shouldRetry = this.shouldRetry(axiosError, attempt);
        if (!shouldRetry) {
          break;
        }

        if (attempt < this.retryConfig.retries) {
          const delay = calculateRetryDelay(attempt, this.retryConfig);
          await this.sleep(delay);
        }
      }
    }

    const axiosError = lastError as AxiosError<{ message?: string }>;
    return {
      success: false,
      error: {
        code: axiosError.response?.status?.toString() || 'UNKNOWN',
        message:
          axiosError.response?.data?.message || lastError?.message || 'An error occurred',
      },
    };
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    if (attempt >= this.retryConfig.retries) {
      return false;
    }

    const status = error.response?.status;
    if (status !== undefined && (status === 429 || (status >= 500 && status < 600))) {
      return true;
    }

    if (!error.response && error.code === 'ECONNABORTED') {
      return true;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  withIdempotencyKey(key: string): ApiClient {
    this.client.interceptors.request.use((config) => {
      config.headers['Idempotency-Key'] = key;
      return config;
    });
    return this;
  }

  withTraceHeader(traceId: string): ApiClient {
    this.client.interceptors.request.use((config) => {
      config.headers['X-Trace-Id'] = traceId;
      return config;
    });
    return this;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};

export { ApiClient, ApiClientConfig, createApiClient, generateIdempotencyKey };
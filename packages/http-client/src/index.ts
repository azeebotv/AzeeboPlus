import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { ApiResponse, TokenStorage } from '@azeebo/shared-types';

// ============================================================================
// Retry Utilities (consolidated from utils/retry.ts)
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  jitterFactor?: number;
  timeoutMs?: number;
  retryOn?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'retryOn'>> & {
  retryOn?: (error: Error, attempt: number) => boolean;
} = {
  maxAttempts: 3,
  baseDelayMs: 100,
  jitterFactor: 0.3,
  timeoutMs: 3000,
  retryOn: undefined,
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (opts.retryOn && !opts.retryOn(lastError, attempt)) {
        throw lastError;
      }

      if (attempt === opts.maxAttempts) {
        break;
      }

      const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = exponentialDelay * opts.jitterFactor * Math.random();
      const delay = exponentialDelay + jitter;

      if (opts.timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, opts.timeoutMs)));
      } else {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Token Storage Implementations
// ============================================================================

class LocalStorageTokenStorage implements TokenStorage {
  private readonly storageKey: string;

  constructor(storageKey: string = 'auth_token') {
    this.storageKey = storageKey;
  }

  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem(this.storageKey);
  }

  async getRefreshToken(): Promise<string | null> {
    return localStorage.getItem(`${this.storageKey}_refresh`);
  }

  async setAccessToken(token: string): Promise<void> {
    localStorage.setItem(this.storageKey, token);
  }

  async setRefreshToken(token: string): Promise<void> {
    localStorage.setItem(`${this.storageKey}_refresh`, token);
  }

  async clearTokens(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(`${this.storageKey}_refresh`);
  }
}

export class NoopTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    return null;
  }
  async getRefreshToken(): Promise<string | null> {
    return null;
  }
  async setAccessToken(_token: string): Promise<void> {}
  async setRefreshToken(_token: string): Promise<void> {}
  async clearTokens(): Promise<void> {}
}

export const noopTokenStorage = new NoopTokenStorage();

// ============================================================================
// Utility Functions
// ============================================================================

export function generateIdempotencyKey(): string {
  return `idemp-${Date.now()}-${randomUUID()}`;
}

function jitter(value: number): number {
  return Math.random() * value;
}

function calculateRetryDelay(attempt: number, config: ClientRetryConfig): number {
  const exponentialDelay = config.delay * Math.pow(config.backoffFactor, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  return Math.round(jitter(cappedDelay));
}

// ============================================================================
// Configuration Types
// ============================================================================

interface ClientRetryConfig {
  retries: number;
  delay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryConfig?: Partial<ClientRetryConfig>;
  tokenStorage?: TokenStorage;
  authStorageKey?: string;
  defaultHeaders?: Record<string, string>;
}

export interface ServiceClientConfig {
  baseURL: string;
  timeout?: number;
  retry?: {
    maxRetries: number;
    delay: number;
    backoffMultiplier: number;
  };
  headers?: Record<string, string>;
  apiKey?: string;
}

const DEFAULT_API_RETRY_CONFIG: ClientRetryConfig = {
  retries: 3,
  delay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

const DEFAULT_SERVICE_RETRY_CONFIG = {
  maxRetries: 3,
  delay: 1000,
  backoffMultiplier: 2,
};

// ============================================================================
// ApiClient (Browser-side with token storage)
// ============================================================================

/** HTTP API client with automatic retry, idempotency keys, and token management. */
export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private tokenStorage: TokenStorage;
  private retryConfig: ClientRetryConfig;
  private _idempotencyInterceptorId?: number;
  private _traceInterceptorId?: number;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };

    this.retryConfig = {
      ...DEFAULT_API_RETRY_CONFIG,
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
      console.warn('ApiClient: Using localStorage for token storage is not secure for production.');
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
      async (reqConfig) => {
        const token = await this.tokenStorage.getAccessToken();
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
      async (error) => {
        if (error.response?.status === 401) {
          await this.tokenStorage.clearTokens();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('get', url, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('post', url, { data, ...config });
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('put', url, { data, ...config });
  }

  async patch<T>(
    url: string,
    data?: unknown,
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
        const response: AxiosResponse<T> = await this.client({ method, url, ...config });
        return { success: true, data: response.data };
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        lastError = error as Error;

        if (!this.shouldRetry(axiosError, attempt)) {
          break;
        }

        if (attempt < this.retryConfig.retries) {
          const delay = calculateRetryDelay(attempt, this.retryConfig);
          await this.sleep(delay);
        }
      }
    }

    const axiosError = lastError as AxiosError<{
      message?: string;
      code?: string;
      details?: unknown;
    }>;
    return {
      success: false,
      error: {
        code:
          axiosError.response?.data?.code || axiosError.response?.status?.toString() || 'UNKNOWN',
        message: axiosError.response?.data?.message || lastError?.message || 'An error occurred',
        details: axiosError.response?.data?.details as Record<string, unknown> | undefined,
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
    if (this._idempotencyInterceptorId !== undefined) {
      this.client.interceptors.request.eject(this._idempotencyInterceptorId);
    }
    this._idempotencyInterceptorId = this.client.interceptors.request.use((config) => {
      config.headers['Idempotency-Key'] = key;
      return config;
    });
    return this;
  }

  withTraceHeader(traceId: string): ApiClient {
    if (this._traceInterceptorId !== undefined) {
      this.client.interceptors.request.eject(this._traceInterceptorId);
    }
    this._traceInterceptorId = this.client.interceptors.request.use((config) => {
      config.headers['X-Trace-Id'] = traceId;
      return config;
    });
    return this;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};

// ============================================================================
// ServiceClient (Server-side with API key auth)
// ============================================================================

/** Base HTTP client for internal service-to-service communication with retry and idempotency. */
export class ServiceClient {
  protected axiosInstance: AxiosInstance;
  protected retryConfig: typeof DEFAULT_SERVICE_RETRY_CONFIG;

  constructor(config: ServiceClientConfig) {
    this.retryConfig = config.retry || DEFAULT_SERVICE_RETRY_CONFIG;
    const apiKey = config.apiKey || process.env.INTERNAL_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-internal-api-key': apiKey } : {}),
        ...config.headers,
      },
    });
  }

  protected async retryRequest<T>(
    request: () => Promise<AxiosResponse<T>>,
    retries: number,
    delay: number
  ): Promise<AxiosResponse<T>> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const maxDelay = 10000;
        const waitTime = Math.min(jitter(delay), maxDelay);
        await this.sleep(waitTime);
        return this.retryRequest(request, retries - 1, delay * this.retryConfig.backoffMultiplier);
      }
      throw error;
    }
  }

  protected isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return (
        status === 408 ||
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNREFUSED'
      );
    }
    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const request = () => this.axiosInstance.get<T>(url, config);
    const response = await this.retryRequest(
      request,
      this.retryConfig.maxRetries,
      this.retryConfig.delay
    );
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const request = () =>
      this.axiosInstance.post<T>(url, data, {
        ...config,
        headers: {
          'Idempotency-Key': config?.headers?.['Idempotency-Key'] || randomUUID(),
          ...config?.headers,
        },
      });
    const response = await this.retryRequest(
      request,
      this.retryConfig.maxRetries,
      this.retryConfig.delay
    );
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const request = () =>
      this.axiosInstance.put<T>(url, data, {
        ...config,
        headers: {
          'Idempotency-Key': config?.headers?.['Idempotency-Key'] || randomUUID(),
          ...config?.headers,
        },
      });
    const response = await this.retryRequest(
      request,
      this.retryConfig.maxRetries,
      this.retryConfig.delay
    );
    return response.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const request = () =>
      this.axiosInstance.patch<T>(url, data, {
        ...config,
        headers: {
          'Idempotency-Key': config?.headers?.['Idempotency-Key'] || randomUUID(),
          ...config?.headers,
        },
      });
    const response = await this.retryRequest(
      request,
      this.retryConfig.maxRetries,
      this.retryConfig.delay
    );
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const request = () => this.axiosInstance.delete<T>(url, config);
    const response = await this.retryRequest(
      request,
      this.retryConfig.maxRetries,
      this.retryConfig.delay
    );
    return response.data;
  }
}

// ============================================================================
// Typed Service Clients
// ============================================================================

/** Client for the auth-service */
export class AuthServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000' });
  }

  async validateToken(token: string): Promise<{ userId: string; roles: string[] }> {
    return this.get('/auth/validate', { headers: { Authorization: `Bearer ${token}` } });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post('/auth/refresh', { refreshToken });
  }
}

/** Client for the wallet-service */
export class WalletServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3002' });
  }

  async debitWallet(
    walletId: string,
    amount: number,
    description: string,
    idempotencyKey: string
  ): Promise<{ balance: string }> {
    return this.post('/v1/wallet/debit', { walletId, amount, description, idempotencyKey });
  }

  async creditWallet(
    walletId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<{ balance: string }> {
    return this.post('/v1/wallet/credit', { walletId, amount, description, reference });
  }

  async getWallet(
    userId: string
  ): Promise<{ id: string; userId: string; balance: string; currency: string }> {
    return this.get(`/v1/wallet/user/${userId}`);
  }
}

/** Client for the payment-service */
export class PaymentServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003' });
  }

  async createTransaction(
    userId: string,
    amount: number,
    provider: string
  ): Promise<{ id: string; status: string; checkoutUrl?: string }> {
    return this.post('/v1/payments/initiate', { userId, amount, provider });
  }

  async verifyTransaction(
    transactionId: string
  ): Promise<{ id: string; status: string; amount: number }> {
    return this.get(`/v1/payments/verify/${transactionId}`);
  }

  async createRefund(
    transactionId: string,
    amount: number
  ): Promise<{ id: string; status: string }> {
    return this.post('/v1/payments/refund', { transactionId, amount });
  }
}

/** Client for the analytics-service */
export class AnalyticsServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008' });
  }

  async trackEvent(
    eventName: string,
    userId: string,
    universe: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await this.post('/analytics/track', {
      eventName,
      userId,
      universe,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  async trackBatch(
    events: Array<{
      eventName: string;
      userId: string;
      universe: string;
      metadata: Record<string, unknown>;
    }>
  ): Promise<void> {
    await this.post('/analytics/track-batch', { events });
  }
}

/** Client for the notification-service */
export class NotificationServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006' });
  }

  async sendNotification(
    userId: string,
    type: string,
    payload: Record<string, unknown>
  ): Promise<{ id: string }> {
    return this.post('/v1/notifications/send', { userId, type, payload });
  }

  async sendBulkNotification(
    userIds: string[],
    type: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.post('/v1/notifications/bulk', { userIds, type, payload });
  }
}

/** Client for the content-service */
export class ContentServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004' });
  }

  async checkAccess(
    userId: string,
    contentId: string
  ): Promise<{ access: boolean; reason?: string }> {
    return this.get(`/v1/content/access/${contentId}`, { headers: { 'X-User-Id': userId } });
  }

  async getContent(
    contentId: string
  ): Promise<{ id: string; title: string; type: string; accessType: string }> {
    return this.get(`/v1/content/${contentId}`);
  }
}

/** Client for the user-service */
export class UserServiceClient extends ServiceClient {
  constructor() {
    super({ baseURL: process.env.USER_SERVICE_URL || 'http://user-service:3001' });
  }

  async getUser(
    userId: string
  ): Promise<{ id: string; displayName: string; email: string; roles: string[] }> {
    return this.get(`/v1/users/${userId}`);
  }

  async updateUser(
    userId: string,
    data: Partial<{ displayName: string; avatar: string }>
  ): Promise<{ id: string }> {
    return this.put(`/v1/users/${userId}`, data);
  }
}

/** Factory that creates instances of all internal service clients. */
export const createServiceClients = () => ({
  auth: new AuthServiceClient(),
  wallet: new WalletServiceClient(),
  payment: new PaymentServiceClient(),
  analytics: new AnalyticsServiceClient(),
  notification: new NotificationServiceClient(),
  content: new ContentServiceClient(),
  user: new UserServiceClient(),
});

export type ServiceClients = ReturnType<typeof createServiceClients>;

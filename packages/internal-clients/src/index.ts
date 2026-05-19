import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoffMultiplier: number;
}

interface ClientConfig {
  baseURL: string;
  timeout?: number;
  retry?: RetryConfig;
  headers?: Record<string, string>;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  delay: 1000,
  backoffMultiplier: 2,
};

export class ServiceClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: ClientConfig) {
    this.retryConfig = config.retry || defaultRetryConfig;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  }

  private async retryRequest<T>(
    request: () => Promise<AxiosResponse<T>>,
    retries: number,
    delay: number
  ): Promise<AxiosResponse<T>> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.sleep(delay);
        return this.retryRequest(request, retries - 1, delay * this.retryConfig.backoffMultiplier);
      }
      throw error;
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return (
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNREFUSED'
      );
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const request = () => this.axiosInstance.get<T>(url, config);
    const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
    return response.data;
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const request = () => this.axiosInstance.post<T>(url, data, {
      ...config,
      headers: {
        'Idempotency-Key': config?.headers?.['Idempotency-Key'] || uuidv4(),
        ...config?.headers,
      },
    });
    const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
    return response.data;
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const request = () => this.axiosInstance.put<T>(url, data, {
      ...config,
      headers: {
        'Idempotency-Key': config?.headers?.['Idempotency-Key'] || uuidv4(),
        ...config?.headers,
      },
    });
    const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
    return response.data;
  }

  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const request = () => this.axiosInstance.patch<T>(url, data, {
      ...config,
      headers: {
        'Idempotency-Key': config?.headers?.['Idempotency-Key'] || uuidv4(),
        ...config?.headers,
      },
    });
    const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
    return response.data;
  }

  public async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const request = () => this.axiosInstance.delete<T>(url, config);
    const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
    return response.data;
  }
}

export class AuthServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
    });
  }

  async validateToken(token: string): Promise<{ userId: string; roles: string[] }> {
    return this.get('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post('/auth/refresh', { refreshToken });
  }
}

export class WalletServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3002',
    });
  }

  async debitWallet(walletId: string, amount: number, description: string, idempotencyKey: string): Promise<{ balance: string }> {
    return this.post('/wallet/debit', { walletId, amount, description, idempotencyKey });
  }

  async creditWallet(walletId: string, amount: number, description: string, reference?: string): Promise<{ balance: string }> {
    return this.post('/wallet/credit', { walletId, amount, description, reference });
  }

  async getWallet(userId: string): Promise<{ id: string; userId: string; balance: string; currency: string }> {
    return this.get(`/wallet/user/${userId}`);
  }
}

export class PaymentServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
    });
  }

  async createTransaction(userId: string, amount: number, provider: string): Promise<{ id: string; status: string; checkoutUrl?: string }> {
    return this.post('/payments/initiate', { userId, amount, provider });
  }

  async verifyTransaction(transactionId: string): Promise<{ id: string; status: string; amount: number }> {
    return this.get(`/payments/verify/${transactionId}`);
  }

  async createRefund(transactionId: string, amount: number): Promise<{ id: string; status: string }> {
    return this.post('/payments/refund', { transactionId, amount });
  }
}

export class AnalyticsServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008',
    });
  }

  async trackEvent(eventName: string, userId: string, universe: string, metadata: Record<string, unknown>): Promise<void> {
    await this.post('/analytics/track', {
      eventName,
      userId,
      universe,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  async trackBatch(events: Array<{ eventName: string; userId: string; universe: string; metadata: Record<string, unknown> }>): Promise<void> {
    await this.post('/analytics/track-batch', { events });
  }
}

export class NotificationServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
    });
  }

  async sendNotification(userId: string, type: string, payload: Record<string, unknown>): Promise<{ id: string }> {
    return this.post('/notifications/send', { userId, type, payload });
  }

  async sendBulkNotification(userIds: string[], type: string, payload: Record<string, unknown>): Promise<void> {
    await this.post('/notifications/bulk', { userIds, type, payload });
  }
}

export class ContentServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
    });
  }

  async checkAccess(userId: string, contentId: string): Promise<{ access: boolean; reason?: string }> {
    return this.get(`/content/access/${contentId}`, {
      headers: { 'X-User-Id': userId },
    });
  }

  async getContent(contentId: string): Promise<{ id: string; title: string; type: string; accessType: string }> {
    return this.get(`/content/${contentId}`);
  }
}

export class UserServiceClient extends ServiceClient {
  constructor() {
    super({
      baseURL: process.env.USER_SERVICE_URL || 'http://user-service:3001',
    });
  }

  async getUser(userId: string): Promise<{ id: string; displayName: string; email: string; roles: string[] }> {
    return this.get(`/users/${userId}`);
  }

  async updateUser(userId: string, data: Partial<{ displayName: string; avatar: string }>): Promise<{ id: string }> {
    return this.put(`/users/${userId}`, data);
  }

  async getUserWallet(userId: string): Promise<{ walletId: string }> {
    return this.get(`/users/${userId}/wallet`);
  }
}

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
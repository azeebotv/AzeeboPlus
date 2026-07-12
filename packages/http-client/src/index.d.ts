import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, TokenStorage } from '@azeebo/shared-types';
export interface RetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
    jitterFactor?: number;
    timeoutMs?: number;
    retryOn?: (error: Error, attempt: number) => boolean;
}
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
export declare class NoopTokenStorage implements TokenStorage {
    getAccessToken(): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    setAccessToken(_token: string): Promise<void>;
    setRefreshToken(_token: string): Promise<void>;
    clearTokens(): Promise<void>;
}
export declare const noopTokenStorage: NoopTokenStorage;
export declare function generateIdempotencyKey(): string;
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
declare const DEFAULT_SERVICE_RETRY_CONFIG: {
    maxRetries: number;
    delay: number;
    backoffMultiplier: number;
};
/** HTTP API client with automatic retry, idempotency keys, and token management. */
export declare class ApiClient {
    private client;
    private config;
    private tokenStorage;
    private retryConfig;
    private _idempotencyInterceptorId?;
    private _traceInterceptorId?;
    constructor(config: ApiClientConfig);
    get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    private requestWithRetry;
    private shouldRetry;
    private sleep;
    withIdempotencyKey(key: string): ApiClient;
    withTraceHeader(traceId: string): ApiClient;
    getClient(): AxiosInstance;
}
export declare const createApiClient: (config: ApiClientConfig) => ApiClient;
/** Base HTTP client for internal service-to-service communication with retry and idempotency. */
export declare class ServiceClient {
    protected axiosInstance: AxiosInstance;
    protected retryConfig: typeof DEFAULT_SERVICE_RETRY_CONFIG;
    constructor(config: ServiceClientConfig);
    protected retryRequest<T>(request: () => Promise<AxiosResponse<T>>, retries: number, delay: number): Promise<AxiosResponse<T>>;
    protected isRetryableError(error: unknown): boolean;
    protected sleep(ms: number): Promise<void>;
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
/** Client for the auth-service */
export declare class AuthServiceClient extends ServiceClient {
    constructor();
    validateToken(token: string): Promise<{
        userId: string;
        roles: string[];
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
/** Client for the wallet-service */
export declare class WalletServiceClient extends ServiceClient {
    constructor();
    debitWallet(walletId: string, amount: number, description: string, idempotencyKey: string): Promise<{
        balance: string;
    }>;
    creditWallet(walletId: string, amount: number, description: string, reference?: string): Promise<{
        balance: string;
    }>;
    getWallet(userId: string): Promise<{
        id: string;
        userId: string;
        balance: string;
        currency: string;
    }>;
}
/** Client for the payment-service */
export declare class PaymentServiceClient extends ServiceClient {
    constructor();
    createTransaction(userId: string, amount: number, provider: string): Promise<{
        id: string;
        status: string;
        checkoutUrl?: string;
    }>;
    verifyTransaction(transactionId: string): Promise<{
        id: string;
        status: string;
        amount: number;
    }>;
    createRefund(transactionId: string, amount: number): Promise<{
        id: string;
        status: string;
    }>;
}
/** Client for the analytics-service */
export declare class AnalyticsServiceClient extends ServiceClient {
    constructor();
    trackEvent(eventName: string, userId: string, universe: string, metadata: Record<string, unknown>): Promise<void>;
    trackBatch(events: Array<{
        eventName: string;
        userId: string;
        universe: string;
        metadata: Record<string, unknown>;
    }>): Promise<void>;
}
/** Client for the notification-service */
export declare class NotificationServiceClient extends ServiceClient {
    constructor();
    sendNotification(userId: string, type: string, payload: Record<string, unknown>): Promise<{
        id: string;
    }>;
    sendBulkNotification(userIds: string[], type: string, payload: Record<string, unknown>): Promise<void>;
}
/** Client for the content-service */
export declare class ContentServiceClient extends ServiceClient {
    constructor();
    checkAccess(userId: string, contentId: string): Promise<{
        access: boolean;
        reason?: string;
    }>;
    getContent(contentId: string): Promise<{
        id: string;
        title: string;
        type: string;
        accessType: string;
    }>;
}
/** Client for the user-service */
export declare class UserServiceClient extends ServiceClient {
    constructor();
    getUser(userId: string): Promise<{
        id: string;
        displayName: string;
        email: string;
        roles: string[];
    }>;
    updateUser(userId: string, data: Partial<{
        displayName: string;
        avatar: string;
    }>): Promise<{
        id: string;
    }>;
}
/** Factory that creates instances of all internal service clients. */
export declare const createServiceClients: () => {
    auth: AuthServiceClient;
    wallet: WalletServiceClient;
    payment: PaymentServiceClient;
    analytics: AnalyticsServiceClient;
    notification: NotificationServiceClient;
    content: ContentServiceClient;
    user: UserServiceClient;
};
export type ServiceClients = ReturnType<typeof createServiceClients>;
export {};

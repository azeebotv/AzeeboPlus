"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceClients = exports.UserServiceClient = exports.ContentServiceClient = exports.NotificationServiceClient = exports.AnalyticsServiceClient = exports.PaymentServiceClient = exports.WalletServiceClient = exports.AuthServiceClient = exports.ServiceClient = exports.createApiClient = exports.ApiClient = exports.noopTokenStorage = exports.NoopTokenStorage = void 0;
exports.withRetry = withRetry;
exports.generateIdempotencyKey = generateIdempotencyKey;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    baseDelayMs: 100,
    jitterFactor: 0.3,
    timeoutMs: 3000,
    retryOn: undefined,
};
async function withRetry(fn, options = {}) {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
            }
            else {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
// ============================================================================
// Token Storage Implementations
// ============================================================================
class LocalStorageTokenStorage {
    storageKey;
    constructor(storageKey = 'auth_token') {
        this.storageKey = storageKey;
    }
    async getAccessToken() {
        return localStorage.getItem(this.storageKey);
    }
    async getRefreshToken() {
        return localStorage.getItem(`${this.storageKey}_refresh`);
    }
    async setAccessToken(token) {
        localStorage.setItem(this.storageKey, token);
    }
    async setRefreshToken(token) {
        localStorage.setItem(`${this.storageKey}_refresh`, token);
    }
    async clearTokens() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(`${this.storageKey}_refresh`);
    }
}
class NoopTokenStorage {
    async getAccessToken() {
        return null;
    }
    async getRefreshToken() {
        return null;
    }
    async setAccessToken(_token) { }
    async setRefreshToken(_token) { }
    async clearTokens() { }
}
exports.NoopTokenStorage = NoopTokenStorage;
exports.noopTokenStorage = new NoopTokenStorage();
// ============================================================================
// Utility Functions
// ============================================================================
function generateIdempotencyKey() {
    return `idemp-${Date.now()}-${(0, crypto_1.randomUUID)()}`;
}
function jitter(value) {
    return Math.random() * value;
}
function calculateRetryDelay(attempt, config) {
    const exponentialDelay = config.delay * Math.pow(config.backoffFactor, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    return Math.round(jitter(cappedDelay));
}
const DEFAULT_API_RETRY_CONFIG = {
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
class ApiClient {
    client;
    config;
    tokenStorage;
    retryConfig;
    _idempotencyInterceptorId;
    _traceInterceptorId;
    constructor(config) {
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
        }
        else {
            const isProduction = process.env.NODE_ENV === 'production';
            if (isProduction) {
                throw new Error('ApiClient: tokenStorage is required in production. Please provide a secure storage implementation.');
            }
            console.warn('ApiClient: Using localStorage for token storage is not secure for production.');
            this.tokenStorage = new LocalStorageTokenStorage(this.config.authStorageKey);
        }
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.defaultHeaders,
            },
        });
        this.client.interceptors.request.use(async (reqConfig) => {
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
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401) {
                await this.tokenStorage.clearTokens();
            }
            return Promise.reject(error);
        });
    }
    async get(url, config) {
        return this.requestWithRetry('get', url, config);
    }
    async post(url, data, config) {
        return this.requestWithRetry('post', url, { data, ...config });
    }
    async put(url, data, config) {
        return this.requestWithRetry('put', url, { data, ...config });
    }
    async patch(url, data, config) {
        return this.requestWithRetry('patch', url, { data, ...config });
    }
    async delete(url, config) {
        return this.requestWithRetry('delete', url, config);
    }
    async requestWithRetry(method, url, config) {
        let lastError;
        for (let attempt = 0; attempt <= this.retryConfig.retries; attempt++) {
            try {
                const response = await this.client({ method, url, ...config });
                return { success: true, data: response.data };
            }
            catch (error) {
                const axiosError = error;
                lastError = error;
                if (!this.shouldRetry(axiosError, attempt)) {
                    break;
                }
                if (attempt < this.retryConfig.retries) {
                    const delay = calculateRetryDelay(attempt, this.retryConfig);
                    await this.sleep(delay);
                }
            }
        }
        const axiosError = lastError;
        return {
            success: false,
            error: {
                code: axiosError.response?.data?.code || axiosError.response?.status?.toString() || 'UNKNOWN',
                message: axiosError.response?.data?.message || lastError?.message || 'An error occurred',
                details: axiosError.response?.data?.details,
            },
        };
    }
    shouldRetry(error, attempt) {
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
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    withIdempotencyKey(key) {
        if (this._idempotencyInterceptorId !== undefined) {
            this.client.interceptors.request.eject(this._idempotencyInterceptorId);
        }
        this._idempotencyInterceptorId = this.client.interceptors.request.use((config) => {
            config.headers['Idempotency-Key'] = key;
            return config;
        });
        return this;
    }
    withTraceHeader(traceId) {
        if (this._traceInterceptorId !== undefined) {
            this.client.interceptors.request.eject(this._traceInterceptorId);
        }
        this._traceInterceptorId = this.client.interceptors.request.use((config) => {
            config.headers['X-Trace-Id'] = traceId;
            return config;
        });
        return this;
    }
    getClient() {
        return this.client;
    }
}
exports.ApiClient = ApiClient;
const createApiClient = (config) => {
    return new ApiClient(config);
};
exports.createApiClient = createApiClient;
// ============================================================================
// ServiceClient (Server-side with API key auth)
// ============================================================================
/** Base HTTP client for internal service-to-service communication with retry and idempotency. */
class ServiceClient {
    axiosInstance;
    retryConfig;
    constructor(config) {
        this.retryConfig = config.retry || DEFAULT_SERVICE_RETRY_CONFIG;
        const apiKey = config.apiKey || process.env.INTERNAL_API_KEY;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'x-internal-api-key': apiKey } : {}),
                ...config.headers,
            },
        });
    }
    async retryRequest(request, retries, delay) {
        try {
            return await request();
        }
        catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                const maxDelay = 10000;
                const waitTime = Math.min(jitter(delay), maxDelay);
                await this.sleep(waitTime);
                return this.retryRequest(request, retries - 1, delay * this.retryConfig.backoffMultiplier);
            }
            throw error;
        }
    }
    isRetryableError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const status = error.response?.status;
            return (status === 408 ||
                status === 429 ||
                status === 502 ||
                status === 503 ||
                status === 504 ||
                error.code === 'ECONNABORTED' ||
                error.code === 'ECONNREFUSED');
        }
        return false;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async get(url, config) {
        const request = () => this.axiosInstance.get(url, config);
        const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
        return response.data;
    }
    async post(url, data, config) {
        const request = () => this.axiosInstance.post(url, data, {
            ...config,
            headers: {
                'Idempotency-Key': config?.headers?.['Idempotency-Key'] || (0, crypto_1.randomUUID)(),
                ...config?.headers,
            },
        });
        const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
        return response.data;
    }
    async put(url, data, config) {
        const request = () => this.axiosInstance.put(url, data, {
            ...config,
            headers: {
                'Idempotency-Key': config?.headers?.['Idempotency-Key'] || (0, crypto_1.randomUUID)(),
                ...config?.headers,
            },
        });
        const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
        return response.data;
    }
    async patch(url, data, config) {
        const request = () => this.axiosInstance.patch(url, data, {
            ...config,
            headers: {
                'Idempotency-Key': config?.headers?.['Idempotency-Key'] || (0, crypto_1.randomUUID)(),
                ...config?.headers,
            },
        });
        const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
        return response.data;
    }
    async delete(url, config) {
        const request = () => this.axiosInstance.delete(url, config);
        const response = await this.retryRequest(request, this.retryConfig.maxRetries, this.retryConfig.delay);
        return response.data;
    }
}
exports.ServiceClient = ServiceClient;
// ============================================================================
// Typed Service Clients
// ============================================================================
/** Client for the auth-service */
class AuthServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000' });
    }
    async validateToken(token) {
        return this.get('/auth/validate', { headers: { Authorization: `Bearer ${token}` } });
    }
    async refreshToken(refreshToken) {
        return this.post('/auth/refresh', { refreshToken });
    }
}
exports.AuthServiceClient = AuthServiceClient;
/** Client for the wallet-service */
class WalletServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3002' });
    }
    async debitWallet(walletId, amount, description, idempotencyKey) {
        return this.post('/v1/wallet/debit', { walletId, amount, description, idempotencyKey });
    }
    async creditWallet(walletId, amount, description, reference) {
        return this.post('/v1/wallet/credit', { walletId, amount, description, reference });
    }
    async getWallet(userId) {
        return this.get(`/v1/wallet/user/${userId}`);
    }
}
exports.WalletServiceClient = WalletServiceClient;
/** Client for the payment-service */
class PaymentServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003' });
    }
    async createTransaction(userId, amount, provider) {
        return this.post('/v1/payments/initiate', { userId, amount, provider });
    }
    async verifyTransaction(transactionId) {
        return this.get(`/v1/payments/verify/${transactionId}`);
    }
    async createRefund(transactionId, amount) {
        return this.post('/v1/payments/refund', { transactionId, amount });
    }
}
exports.PaymentServiceClient = PaymentServiceClient;
/** Client for the analytics-service */
class AnalyticsServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008' });
    }
    async trackEvent(eventName, userId, universe, metadata) {
        await this.post('/analytics/track', {
            eventName,
            userId,
            universe,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    async trackBatch(events) {
        await this.post('/analytics/track-batch', { events });
    }
}
exports.AnalyticsServiceClient = AnalyticsServiceClient;
/** Client for the notification-service */
class NotificationServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006' });
    }
    async sendNotification(userId, type, payload) {
        return this.post('/v1/notifications/send', { userId, type, payload });
    }
    async sendBulkNotification(userIds, type, payload) {
        await this.post('/v1/notifications/bulk', { userIds, type, payload });
    }
}
exports.NotificationServiceClient = NotificationServiceClient;
/** Client for the content-service */
class ContentServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004' });
    }
    async checkAccess(userId, contentId) {
        return this.get(`/v1/content/access/${contentId}`, { headers: { 'X-User-Id': userId } });
    }
    async getContent(contentId) {
        return this.get(`/v1/content/${contentId}`);
    }
}
exports.ContentServiceClient = ContentServiceClient;
/** Client for the user-service */
class UserServiceClient extends ServiceClient {
    constructor() {
        super({ baseURL: process.env.USER_SERVICE_URL || 'http://user-service:3001' });
    }
    async getUser(userId) {
        return this.get(`/v1/users/${userId}`);
    }
    async updateUser(userId, data) {
        return this.put(`/v1/users/${userId}`, data);
    }
}
exports.UserServiceClient = UserServiceClient;
/** Factory that creates instances of all internal service clients. */
const createServiceClients = () => ({
    auth: new AuthServiceClient(),
    wallet: new WalletServiceClient(),
    payment: new PaymentServiceClient(),
    analytics: new AnalyticsServiceClient(),
    notification: new NotificationServiceClient(),
    content: new ContentServiceClient(),
    user: new UserServiceClient(),
});
exports.createServiceClients = createServiceClients;

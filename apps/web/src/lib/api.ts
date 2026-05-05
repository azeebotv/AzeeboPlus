// API client for backend services

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletBalance {
  balance: number;
  currency: string;
  pendingBalance?: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  universeId: string;
  status: 'draft' | 'processing' | 'published' | 'archived';
  contentType?: string;
  duration?: number;
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

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface PaymentInitRequest {
  amount: number;
  currency: string;
  email: string;
  metadata?: Record<string, string>;
}

interface PaymentInitResponse {
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
}

interface PaymentVerifyResponse {
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  reference: string;
  transactionId?: string;
}

interface RecommendationItem {
  id: string;
  score: number;
  reason: string;
  content: ContentItem;
}

interface Universe {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  contentCount?: number;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  contentCount?: number;
}

interface SearchFilters {
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

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface AnalyticsUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AnalyticsContent {
  id: string;
  title: string;
  views: number;
  likes: number;
  shares: number;
}

interface AnalyticsRevenue {
  date: string;
  amount: number;
  currency: string;
}

interface AnalyticsOverview {
  users: AnalyticsUser[];
  content: AnalyticsContent[];
  revenue: AnalyticsRevenue[];
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  private calculateDelay(attempt: number): number {
    const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelayMs);
  }

  private isRetryableError(statusCode?: number, error?: string): boolean {
    if (statusCode && RETRY_CONFIG.retryableStatusCodes.includes(statusCode)) {
      return true;
    }
    if (error === 'Network error. Please check your connection.' ||
        error === 'Request timeout. Please try again.') {
      return true;
    }
    return false;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        if (this.isRetryableError(response.status) && attempt < RETRY_CONFIG.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, attempt + 1);
        }

        return {
          success: false,
          message: data.message || 'An error occurred',
          error: data.error,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, attempt + 1);
        }
        return {
          success: false,
          message: 'Request timeout. Please try again.',
          error: 'Request timeout',
          statusCode: 408,
        };
      }

      if (this.isRetryableError(undefined, error instanceof Error ? error.message : undefined) &&
          attempt < RETRY_CONFIG.maxRetries) {
        const delay = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, attempt + 1);
      }

      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  auth = {
    login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as ApiResponse<AuthResponse>;
    },

    register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
      const response = await this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as ApiResponse<AuthResponse>;
    },

    logout: async (): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    },

    refreshToken: async (refreshToken: string): Promise<ApiResponse<{ access_token: string }>> => {
      return this.request<{ access_token: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    },

    verifyMFA: async (code: string): Promise<ApiResponse<AuthResponse>> => {
      return this.request<AuthResponse>('/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    requestPasswordReset: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/auth/password/reset-request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (
      token: string,
      newPassword: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    },
  };

  user = {
    getProfile: async (): Promise<ApiResponse<User>> => {
      return this.request<User>('/user/profile');
    },

    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
      return this.request<User>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getWatchHistory: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/user/history?page=${page}&limit=${limit}`
      );
    },

    addToWatchHistory: async (
      contentId: string,
      progress = 0
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/user/history', {
        method: 'POST',
        body: JSON.stringify({ contentId, progress }),
      });
    },

    getPreferences: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return this.request<Record<string, unknown>>('/user/preferences');
    },

    updatePreferences: async (
      preferences: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> => {
      return this.request<Record<string, unknown>>('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },
  };

  content = {
    getContent: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
      return this.request<ContentItem>(`/content/${contentId}`);
    },

    getFeaturedContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/content/featured?limit=${limit}`);
    },

    getTrendingContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/content/trending?limit=${limit}`);
    },

    getContentByUniverse: async (
      universeId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/content/universe/${universeId}?page=${page}&limit=${limit}`
      );
    },

    getContentByCategory: async (
      categoryId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/content/category/${categoryId}?page=${page}&limit=${limit}`
      );
    },

    searchContent: async (
      filters: SearchFilters
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.universeId) params.append('universe', filters.universeId);
      if (filters.categoryId) params.append('category', filters.categoryId);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.yearFrom) params.append('yearFrom', filters.yearFrom.toString());
      if (filters.yearTo) params.append('yearTo', filters.yearTo.toString());
      if (filters.sortBy) params.append('sort', filters.sortBy);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      return this.request<PaginatedResponse<ContentItem>>(`/content/search?${params.toString()}`);
    },

    getSignedUrl: async (
      contentId: string
    ): Promise<ApiResponse<{ url: string; expiresIn: number }>> => {
      return this.request<{ url: string; expiresIn: number }>(
        `/content/${contentId}/media/signed-url`
      );
    },

    getCategories: async (): Promise<ApiResponse<Category[]>> => {
      return this.request<Category[]>('/content/categories');
    },

    getContentById: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
      return this.request<ContentItem>(`/content/${contentId}`);
    },

    getRelatedContent: async (
      contentId: string,
      limit = 4
    ): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/content/${contentId}/related?limit=${limit}`);
    },

    getContentByCreator: async (
      creatorId: string,
      limit = 3
    ): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/content/creator/${creatorId}?limit=${limit}`);
    },
  };

  wallet = {
    getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
      return this.request<WalletBalance>('/wallet/balance');
    },

    getTransactions: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return this.request<PaginatedResponse<Transaction>>(
        `/wallet/transactions?page=${page}&limit=${limit}`
      );
    },

    fundWallet: async (
      amount: number,
      paymentMethod: string
    ): Promise<ApiResponse<PaymentInitResponse>> => {
      return this.request<PaymentInitResponse>('/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
    },

    withdraw: async (
      amount: number,
      bankDetails: Record<string, string>
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, bankDetails }),
      });
    },
  };

  payment = {
    initialize: async (data: PaymentInitRequest): Promise<ApiResponse<PaymentInitResponse>> => {
      return this.request<PaymentInitResponse>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    verify: async (reference: string): Promise<ApiResponse<PaymentVerifyResponse>> => {
      return this.request<PaymentVerifyResponse>(`/payments/verify/${reference}`);
    },

    getTransactions: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return this.request<PaginatedResponse<Transaction>>(
        `/payments/transactions?page=${page}&limit=${limit}`
      );
    },

    getProviders: async (): Promise<ApiResponse<{ provider: string; name: string }[]>> => {
      return this.request<{ provider: string; name: string }[]>('/payments/providers');
    },
  };

  recommendation = {
    getForYou: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(`/recommendations/for-you?limit=${limit}`);
    },

    getBecauseYouWatched: async (
      contentId: string,
      limit = 10
    ): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(
        `/recommendations/because-you-watched/${contentId}?limit=${limit}`
      );
    },

    getTrending: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(`/recommendations/trending?limit=${limit}`);
    },

    getPopular: async (
      universeId?: string,
      limit = 10
    ): Promise<ApiResponse<RecommendationItem[]>> => {
      const url = universeId
        ? `/recommendations/popular?universe=${universeId}&limit=${limit}`
        : `/recommendations/popular?limit=${limit}`;
      return this.request<RecommendationItem[]>(url);
    },
  };

  universe = {
    getUniverses: async (): Promise<ApiResponse<Universe[]>> => {
      return this.request<Universe[]>('/universe');
    },

    getUniverse: async (universeId: string): Promise<ApiResponse<Universe>> => {
      return this.request<Universe>(`/universe/${universeId}`);
    },
  };

  creator = {
    getCreators: async (
      page = 1,
      limit = 20
    ): Promise<
      ApiResponse<PaginatedResponse<User & { contentCount: number; subscriberCount: number }>>
    > => {
      return this.request<
        PaginatedResponse<User & { contentCount: number; subscriberCount: number }>
      >(`/creators?page=${page}&limit=${limit}`);
    },

    getCreator: async (
      creatorId: string
    ): Promise<ApiResponse<User & { contentCount: number; subscriberCount: number }>> => {
      return this.request<User & { contentCount: number; subscriberCount: number }>(
        `/creators/${creatorId}`
      );
    },

    getCreatorContent: async (
      creatorId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/creators/${creatorId}/content?page=${page}&limit=${limit}`
      );
    },
  };

  moderation = {
    reportContent: async (
      contentId: string,
      reason: string,
      description?: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/moderation/report', {
        method: 'POST',
        body: JSON.stringify({ contentId, reason, description }),
      });
    },

    getReportReasons: async (): Promise<ApiResponse<{ id: string; label: string }[]>> => {
      return this.request<{ id: string; label: string }[]>('/moderation/report-reasons');
    },
  };

  admin = {
    getDashboard: async (): Promise<
      ApiResponse<{
        totalUsers: number;
        totalContent: number;
        totalViews: number;
        dailyActiveUsers: number;
        dailyViews: number;
        totalRevenue: number;
        newUsers: number;
        newContent: number;
        topCreators: { id: string; name: string; contentCount: number; views: number }[];
        recentActivity: { id: string; action: string; user: string; time: string }[];
      }>
    > => {
      return this.request<{
        totalUsers: number;
        totalContent: number;
        totalViews: number;
        dailyActiveUsers: number;
        dailyViews: number;
        totalRevenue: number;
        newUsers: number;
        newContent: number;
        topCreators: { id: string; name: string; contentCount: number; views: number }[];
        recentActivity: { id: string; action: string; user: string; time: string }[];
      }>('/analytics/dashboard');
    },

    getUsers: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<User>>> => {
      return this.request<PaginatedResponse<User>>(`/admin/users?page=${page}&limit=${limit}`);
    },

    getContent: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/admin/content?page=${page}&limit=${limit}`
      );
    },

    getReportedContent: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem & { reportCount: number }>>> => {
      return this.request<PaginatedResponse<ContentItem & { reportCount: number }>>(
        `/admin/reported?page=${page}&limit=${limit}`
      );
    },

    getAnalytics: async (
      startDate?: string,
      endDate?: string
    ): Promise<ApiResponse<AnalyticsOverview>> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return this.request<AnalyticsOverview>(`/analytics/overview?${params.toString()}`);
    },
  };
}

export const api = new ApiClient(API_BASE_URL);

export type {
  ApiResponse,
  ApiError,
  User,
  WalletBalance,
  Transaction,
  Wallet,
  ContentItem,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerifyResponse,
  RecommendationItem,
  Universe,
  Category,
  SearchFilters,
  PaginatedResponse,
  AnalyticsOverview,
};

// API client for backend services

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
} from './admin-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production');
}
const resolvedApiUrl = API_BASE_URL || 'http://localhost:3013';

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
  displayName?: string;
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

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
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
    if (
      error === 'Network error. Please check your connection.' ||
      error === 'Request timeout. Please try again.'
    ) {
      return true;
    }
    return false;
  }

  async request<T>(
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
          await new Promise((resolve) => setTimeout(resolve, delay));
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
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, attempt + 1);
        }
        return {
          success: false,
          message: 'Request timeout. Please try again.',
          error: 'Request timeout',
          statusCode: 408,
        };
      }

      if (
        this.isRetryableError(undefined, error instanceof Error ? error.message : undefined) &&
        attempt < RETRY_CONFIG.maxRetries
      ) {
        const delay = this.calculateDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
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
      const response = await this.request<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as ApiResponse<AuthResponse>;
    },

    register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
      const response = await this.request<AuthResponse>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response as ApiResponse<AuthResponse>;
    },

    logout: async (): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/auth/logout', {
        method: 'POST',
      });
    },

    refreshToken: async (
      refreshToken: string
    ): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> => {
      return this.request<{ access_token: string; refresh_token: string }>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    },

    verifyMFA: async (code: string): Promise<ApiResponse<AuthResponse>> => {
      return this.request<AuthResponse>('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    requestPasswordReset: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (
      token: string,
      newPassword: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    },

    verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },

    resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
  };

  user = {
    getProfile: async (): Promise<ApiResponse<User>> => {
      return this.request<User>('/api/v1/users/me');
    },

    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
      return this.request<User>('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    completeProfileSetup: async (data: {
      displayName: string;
      bio?: string;
      interests?: string[];
    }): Promise<ApiResponse<User>> => {
      return this.request<User>('/api/v1/users/me/complete-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getWatchHistory: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/users/me/history?page=${page}&limit=${limit}`
      );
    },

    addToWatchHistory: async (
      contentId: string,
      progress = 0
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/users/me/history', {
        method: 'POST',
        body: JSON.stringify({ contentId, progress }),
      });
    },

    getPreferences: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return this.request<Record<string, unknown>>('/api/v1/users/me/preferences');
    },

    updatePreferences: async (
      preferences: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> => {
      return this.request<Record<string, unknown>>('/api/v1/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences),
      });
    },
  };

  content = {
    getContent: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
      return this.request<ContentItem>(`/api/v1/content/${contentId}`);
    },

    getFeaturedContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/api/v1/content/featured?limit=${limit}`);
    },

    getTrendingContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/api/v1/content/trending?limit=${limit}`);
    },

    getContentByUniverse: async (
      universeId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/universe/${universeId}?page=${page}&limit=${limit}`
      );
    },

    getContentByCategory: async (
      categoryId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/category/${categoryId}?page=${page}&limit=${limit}`
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

      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/search?${params.toString()}`
      );
    },

    getSignedUrl: async (
      contentId: string
    ): Promise<ApiResponse<{ url: string; expiresIn: number }>> => {
      return this.request<{ url: string; expiresIn: number }>(
        `/api/v1/content/${contentId}/media/signed-url`
      );
    },

    createContent: async (data: FormData): Promise<ApiResponse<ContentItem>> => {
      // Convert FormData to appropriate format for API
      const formData = new FormData();
      const dataObj = data as unknown as Record<string, unknown>;
      Object.keys(dataObj).forEach((key) => {
        if (dataObj[key] !== undefined && dataObj[key] !== null) {
          if (typeof dataObj[key] === 'object' && !(dataObj[key] instanceof File)) {
            formData.append(key, JSON.stringify(dataObj[key]));
          } else {
            formData.append(key, dataObj[key] as string | Blob);
          }
        }
      });

      return this.request<ContentItem>('/api/v1/content', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type for FormData, let browser set it
      });
    },

    updateContent: async (contentId: string, data: FormData): Promise<ApiResponse<ContentItem>> => {
      // Convert FormData to appropriate format for API
      const formData = new FormData();
      const dataObj = data as unknown as Record<string, unknown>;
      Object.keys(dataObj).forEach((key) => {
        if (dataObj[key] !== undefined && dataObj[key] !== null) {
          if (typeof dataObj[key] === 'object' && !(dataObj[key] instanceof File)) {
            formData.append(key, JSON.stringify(dataObj[key]));
          } else {
            formData.append(key, dataObj[key] as string | Blob);
          }
        }
      });

      return this.request<ContentItem>(`/api/v1/content/${contentId}`, {
        method: 'PUT',
        body: formData,
        // Don't set Content-Type for FormData, let browser set it
      });
    },

    deleteContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/content/${contentId}`, {
        method: 'DELETE',
      });
    },

    getCategories: async (): Promise<ApiResponse<Category[]>> => {
      return this.request<Category[]>('/api/v1/content/categories');
    },

    getContentById: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
      return this.request<ContentItem>(`/api/v1/content/${contentId}`);
    },

    getRelatedContent: async (
      contentId: string,
      limit = 4
    ): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/api/v1/content/${contentId}/related?limit=${limit}`);
    },

    getContentByCreator: async (
      creatorId: string,
      limit = 3
    ): Promise<ApiResponse<ContentItem[]>> => {
      return this.request<ContentItem[]>(`/api/v1/content/creator/${creatorId}?limit=${limit}`);
    },

    getMyContent: async (
      params: {
        limit?: number;
        offset?: number;
        contentType?: string;
        status?: string;
        sort?: 'newest' | 'oldest' | 'popular' | 'trending';
      } = {}
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.contentType) searchParams.append('contentType', params.contentType);
      if (params.status) searchParams.append('status', params.status);
      if (params.sort) searchParams.append('sort', params.sort);

      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/me?${searchParams.toString()}`
      );
    },
  };

  reality = {
    getContestants: async (showId: string): Promise<ApiResponse<Contestant[]>> => {
      return this.request<Contestant[]>(`/api/v1/reality/shows/${showId}/contestants`);
    },
  };

  wallet = {
    getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
      return this.request<WalletBalance>('/api/v1/wallet');
    },

    getTransactions: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return this.request<PaginatedResponse<Transaction>>(
        `/api/v1/wallet/transactions?page=${page}&limit=${limit}`
      );
    },

    fundWallet: async (
      amount: number,
      paymentMethod: string
    ): Promise<ApiResponse<PaymentInitResponse>> => {
      return this.request<PaymentInitResponse>('/api/v1/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
    },

    withdraw: async (
      amount: number,
      bankDetails: Record<string, string>
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, bankDetails }),
      });
    },

    transfer: async (
      amount: number,
      recipientId: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ amount, recipientId }),
      });
    },

    getTransaction: async (transactionId: string): Promise<ApiResponse<Transaction>> => {
      return this.request<Transaction>(`/api/v1/wallet/transactions/${transactionId}`);
    },

    getEarnings: async (params: {
      range: string;
    }): Promise<
      ApiResponse<{
        totalEarnings: number;
        pendingEarnings: number;
        withdrawableBalance: number;
        withdrawableChangePercentage: number;
        avgEarningPerContent: number;
        avgEarningChangePercentage: number;
        earningsTrend: { date: string; amount: number }[];
      }>
    > => {
      return this.request<{
        totalEarnings: number;
        pendingEarnings: number;
        withdrawableBalance: number;
        withdrawableChangePercentage: number;
        avgEarningPerContent: number;
        avgEarningChangePercentage: number;
        earningsTrend: { date: string; amount: number }[];
      }>(`/api/v1/wallet/earnings?range=${params.range}`);
    },
  };

  payment = {
    initialize: async (data: PaymentInitRequest): Promise<ApiResponse<PaymentInitResponse>> => {
      return this.request<PaymentInitResponse>('/api/v1/payments/initialize', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    verify: async (reference: string): Promise<ApiResponse<PaymentVerifyResponse>> => {
      return this.request<PaymentVerifyResponse>(`/api/v1/payments/verify?reference=${reference}`);
    },

    getTransactions: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return this.request<PaginatedResponse<Transaction>>(
        `/api/v1/payments/history?page=${page}&limit=${limit}`
      );
    },

    getPayment: async (paymentId: string): Promise<ApiResponse<Transaction>> => {
      return this.request<Transaction>(`/api/v1/payments/${paymentId}`);
    },

    getProviders: async (): Promise<ApiResponse<{ provider: string; name: string }[]>> => {
      return this.request<{ provider: string; name: string }[]>('/api/v1/payments/providers');
    },
  };

  recommendation = {
    getForYou: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(`/api/v1/recommendation/content?limit=${limit}`);
    },

    getTrending: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(`/api/v1/recommendation/trending?limit=${limit}`);
    },

    getCreators: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(`/api/v1/recommendation/creators?limit=${limit}`);
    },

    getCrossUniverse: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return this.request<RecommendationItem[]>(
        `/api/v1/recommendation/cross-universe?limit=${limit}`
      );
    },
  };

  universe = {
    getUniverses: async (): Promise<ApiResponse<Universe[]>> => {
      return this.request<Universe[]>('/api/v1/universes');
    },

    getUniverse: async (universeId: string): Promise<ApiResponse<Universe>> => {
      return this.request<Universe>(`/api/v1/universes/${universeId}`);
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
      >(`/api/v1/creators?page=${page}&limit=${limit}`);
    },

    getCreator: async (
      creatorId: string
    ): Promise<ApiResponse<User & { contentCount: number; subscriberCount: number }>> => {
      return this.request<User & { contentCount: number; subscriberCount: number }>(
        `/api/v1/creators/${creatorId}`
      );
    },

    getCreatorContent: async (
      creatorId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/creators/${creatorId}/content?page=${page}&limit=${limit}`
      );
    },

    getAnalytics: async (params?: { range?: string }): Promise<ApiResponse<unknown>> => {
      const searchParams = new URLSearchParams();
      if (params?.range) searchParams.append('range', params.range);
      return this.request<unknown>(`/api/v1/creators/analytics?${searchParams.toString()}`);
    },

    getSettings: async (): Promise<
      ApiResponse<{
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
        marketingNotifications: boolean;
        profileVisibility: string;
        showEarnings: boolean;
        allowMessages: boolean;
      }>
    > => {
      return this.request<{
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
        marketingNotifications: boolean;
        profileVisibility: string;
        showEarnings: boolean;
        allowMessages: boolean;
      }>('/api/v1/creators/settings');
    },

    updateSettings: async (data: {
      notifications?: { email?: boolean; push?: boolean; sms?: boolean; marketing?: boolean };
      privacy?: { profileVisibility?: string; showEarnings?: boolean; allowMessages?: boolean };
    }): Promise<ApiResponse<unknown>> => {
      return this.request<unknown>('/api/v1/creators/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getStats: async (): Promise<
      ApiResponse<{
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        followerCount: number;
        contentCount: number;
        totalEarnings: number;
        pendingEarnings: number;
        viewsChangePercentage: number;
        avgEngagementRate: number;
        totalFollowers: number;
        viewsChange: number;
        likesChange: number;
        commentsChange: number;
        followersChange: number;
      }>
    > => {
      return this.request<{
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        followerCount: number;
        contentCount: number;
        totalEarnings: number;
        pendingEarnings: number;
        viewsChangePercentage: number;
        avgEngagementRate: number;
        totalFollowers: number;
        viewsChange: number;
        likesChange: number;
        commentsChange: number;
        followersChange: number;
      }>('/api/v1/creators/stats');
    },
  };

  moderation = {
    reportContent: async (
      contentId: string,
      reason: string,
      description?: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/api/v1/moderation/report', {
        method: 'POST',
        body: JSON.stringify({ contentId, reason, description, type: 'report' }),
      });
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
      }>('/api/v1/admin/analytics');
    },

    getUsers: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<User>>> => {
      return this.request<PaginatedResponse<User>>(
        `/api/v1/admin/users?page=${page}&limit=${limit}`
      );
    },

    getContent: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return this.request<PaginatedResponse<ContentItem>>(
        `/api/v1/admin/content?page=${page}&limit=${limit}`
      );
    },

    getAnalytics: async (
      startDate?: string,
      endDate?: string
    ): Promise<ApiResponse<AnalyticsOverview>> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return this.request<AnalyticsOverview>(`/api/v1/analytics/kpis?${params.toString()}`);
    },

    // Platform Overview
    getPlatformOverview: async (): Promise<ApiResponse<PlatformOverview>> => {
      return this.request<PlatformOverview>('/api/v1/admin/platform-overview');
    },

    // Wallet Management
    getWallets: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<AdminWallet>>> => {
      return this.request<PaginatedResponse<AdminWallet>>(
        `/api/v1/admin/wallets?page=${page}&limit=${limit}`
      );
    },

    updateWalletStatus: async (
      walletId: string,
      status: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/wallets/${walletId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    // Creator Management
    getCreators: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<AdminCreator>>> => {
      return this.request<PaginatedResponse<AdminCreator>>(
        `/api/v1/admin/creators?page=${page}&limit=${limit}`
      );
    },

    updateCreatorStatus: async (
      creatorId: string,
      status: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/creators/${creatorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    verifyCreator: async (creatorId: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/creators/${creatorId}/verify`, {
        method: 'POST',
      });
    },

    // Payment Gateway Management
    getPaymentGateways: async (): Promise<ApiResponse<PaymentGateway[]>> => {
      return this.request<PaymentGateway[]>('/api/v1/admin/payment-gateways');
    },

    togglePaymentGateway: async (
      gatewayId: string,
      isEnabled: boolean
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(
        `/api/v1/admin/payment-gateways/${gatewayId}/toggle`,
        {
          method: 'PUT',
          body: JSON.stringify({ isEnabled }),
        }
      );
    },

    updatePaymentGatewayMode: async (
      gatewayId: string,
      mode: 'live' | 'test'
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/payment-gateways/${gatewayId}/mode`, {
        method: 'PUT',
        body: JSON.stringify({ mode }),
      });
    },

    // Reality Shows Management
    getRealityShows: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<RealityShow>>> => {
      return this.request<PaginatedResponse<RealityShow>>(
        `/api/v1/admin/reality-shows?page=${page}&limit=${limit}`
      );
    },

    updateRealityShowStatus: async (
      showId: string,
      status: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/reality-shows/${showId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    // Content Review
    getContentReviewQueue: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentReviewItem>>> => {
      return this.request<PaginatedResponse<ContentReviewItem>>(
        `/api/v1/admin/content-review?page=${page}&limit=${limit}`
      );
    },

    approveContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(
        `/api/v1/admin/content-review/${contentId}/approve`,
        {
          method: 'POST',
        }
      );
    },

    rejectContent: async (
      contentId: string,
      reason: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/content-review/${contentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    // Engagement Monitoring
    getEngagementMetrics: async (): Promise<ApiResponse<EngagementMetrics>> => {
      return this.request<EngagementMetrics>('/api/v1/admin/engagement/metrics');
    },

    getEngagementTrends: async (
      range: '7d' | '30d' | '90d' = '30d'
    ): Promise<ApiResponse<EngagementTrend[]>> => {
      return this.request<EngagementTrend[]>(`/api/v1/admin/engagement/trends?range=${range}`);
    },

    // Notification Management
    getNotificationTemplates: async (): Promise<ApiResponse<NotificationTemplate[]>> => {
      return this.request<NotificationTemplate[]>('/api/v1/admin/notification-templates');
    },

    getNotificationStats: async (): Promise<ApiResponse<NotificationStats>> => {
      return this.request<NotificationStats>('/api/v1/admin/notification-stats');
    },

    createNotificationTemplate: async (template: {
      name: string;
      type: 'email' | 'push' | 'sms' | 'in-app';
      subject: string;
      content: string;
    }): Promise<ApiResponse<NotificationTemplate>> => {
      return this.request<NotificationTemplate>('/api/v1/admin/notification-templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
    },

    updateNotificationTemplate: async (
      templateId: string,
      template: Partial<NotificationTemplate>
    ): Promise<ApiResponse<NotificationTemplate>> => {
      return this.request<NotificationTemplate>(
        `/api/v1/admin/notification-templates/${templateId}`,
        {
          method: 'PUT',
          body: JSON.stringify(template),
        }
      );
    },

    // Reports
    getReports: async (
      range: '7d' | '30d' | '90d' | 'all' = '30d'
    ): Promise<ApiResponse<AdminReport[]>> => {
      return this.request<AdminReport[]>(`/api/v1/admin/reports?range=${range}`);
    },

    // Custom Reports
    getCustomReports: async (): Promise<ApiResponse<AdminReport[]>> => {
      return this.request<AdminReport[]>('/api/v1/reports');
    },

    createCustomReport: async (report: {
      name: string;
      description?: string;
      category: string;
      metrics: ReportMetric[];
      dimensions: ReportDimension[];
      filters: ReportFilter[];
      dateField: string;
      dateRange: string;
      isPublic: boolean;
    }): Promise<ApiResponse<AdminReport>> => {
      return this.request<AdminReport>('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify(report),
      });
    },

    executeReport: async (reportId: string): Promise<ApiResponse<AdminReport>> => {
      return this.request<AdminReport>('/api/v1/reports/execute', {
        method: 'POST',
        body: JSON.stringify({ reportId }),
      });
    },

    deleteCustomReport: async (reportId: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/reports/${reportId}`, {
        method: 'DELETE',
      });
    },

    // Universe Management
    getAllUniverses: async (): Promise<ApiResponse<AdminUniverse[]>> => {
      return this.request<AdminUniverse[]>('/api/v1/admin/universes');
    },

    getUniverseById: async (id: string): Promise<ApiResponse<AdminUniverse>> => {
      return this.request<AdminUniverse>(`/api/v1/admin/universes/${id}`);
    },

    getUniverseByName: async (name: string): Promise<ApiResponse<AdminUniverse>> => {
      return this.request<AdminUniverse>(`/api/v1/admin/universes/name/${name}`);
    },

    createUniverse: async (universe: {
      name: string;
      displayName: string;
      description?: string;
      icon?: string;
      color?: string;
      isEnabled?: boolean;
      sortOrder?: number;
      metadata?: Record<string, unknown>;
    }): Promise<ApiResponse<AdminUniverse>> => {
      return this.request<AdminUniverse>('/api/v1/admin/universes', {
        method: 'POST',
        body: JSON.stringify(universe),
      });
    },

    updateUniverse: async (
      id: string,
      universe: {
        displayName?: string;
        description?: string;
        icon?: string;
        color?: string;
        isEnabled?: boolean;
        sortOrder?: number;
        metadata?: Record<string, unknown>;
      }
    ): Promise<ApiResponse<AdminUniverse>> => {
      return this.request<AdminUniverse>(`/api/v1/admin/universes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(universe),
      });
    },

    deleteUniverse: async (id: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/universes/${id}`, {
        method: 'DELETE',
      });
    },

    toggleUniverse: async (id: string, isEnabled: boolean): Promise<ApiResponse<AdminUniverse>> => {
      return this.request<AdminUniverse>(`/api/v1/admin/universes/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled }),
      });
    },

    updateFeatureFlag: async (
      universeId: string,
      featureFlag: {
        featureKey: string;
        isEnabled: boolean;
        metadata?: Record<string, unknown>;
      }
    ): Promise<ApiResponse<FeatureFlag>> => {
      return this.request<FeatureFlag>(`/api/v1/admin/universes/${universeId}/feature-flags`, {
        method: 'PUT',
        body: JSON.stringify(featureFlag),
      });
    },

    deleteFeatureFlag: async (
      universeId: string,
      featureKey: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(
        `/api/v1/admin/universes/${universeId}/feature-flags/${featureKey}`,
        {
          method: 'DELETE',
        }
      );
    },

    checkFeatureFlag: async (
      universeName: string,
      featureKey: string
    ): Promise<ApiResponse<{ universeName: string; featureKey: string; isEnabled: boolean }>> => {
      return this.request<{ universeName: string; featureKey: string; isEnabled: boolean }>(
        `/api/v1/admin/universes/check/${universeName}/${featureKey}`
      );
    },

    // System Settings Management
    getAllSettings: async (): Promise<ApiResponse<SystemSetting[]>> => {
      return this.request<SystemSetting[]>('/api/v1/admin/settings');
    },

    getPublicSettings: async (): Promise<ApiResponse<SystemSetting[]>> => {
      return this.request<SystemSetting[]>('/api/v1/admin/settings/public');
    },

    getSettingsMap: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return this.request<Record<string, unknown>>('/api/v1/admin/settings/map');
    },

    getSettingsByCategory: async (category: string): Promise<ApiResponse<SystemSetting[]>> => {
      return this.request<SystemSetting[]>(`/api/v1/admin/settings/category/${category}`);
    },

    getSettingByKey: async (key: string): Promise<ApiResponse<SystemSetting>> => {
      return this.request<SystemSetting>(`/api/v1/admin/settings/${key}`);
    },

    getSettingValue: async (key: string): Promise<ApiResponse<{ key: string; value: unknown }>> => {
      return this.request<{ key: string; value: unknown }>(`/api/v1/admin/settings/value/${key}`);
    },

    createSetting: async (setting: {
      key: string;
      value: unknown;
      category?: string;
      description?: string;
      isPublic?: boolean;
    }): Promise<ApiResponse<SystemSetting>> => {
      return this.request<SystemSetting>('/api/v1/admin/settings', {
        method: 'POST',
        body: JSON.stringify(setting),
      });
    },

    updateSetting: async (
      key: string,
      setting: {
        value?: unknown;
        category?: string;
        description?: string;
        isPublic?: boolean;
      }
    ): Promise<ApiResponse<SystemSetting>> => {
      return this.request<SystemSetting>(`/api/v1/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify(setting),
      });
    },

    deleteSetting: async (key: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/api/v1/admin/settings/${key}`, {
        method: 'DELETE',
      });
    },

    bulkCreateSettings: async (
      settings: Partial<SystemSetting>[]
    ): Promise<ApiResponse<SystemSetting[]>> => {
      return this.request<SystemSetting[]>('/api/v1/admin/settings/bulk', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },

    bulkUpdateSettings: async (
      settings: { key: string; value: unknown }[]
    ): Promise<ApiResponse<SystemSetting[]>> => {
      return this.request<SystemSetting[]>('/api/v1/admin/settings/bulk', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  };
}

export const api = new ApiClient(resolvedApiUrl);

/**
 * Simple fetch helper with auth headers and base URL.
 * Use this for quick API calls instead of raw fetch().
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${resolvedApiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
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
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export type {
  ApiResponse,
  ApiError,
  User,
  WalletBalance,
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

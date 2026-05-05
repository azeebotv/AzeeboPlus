// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole =
  | 'user'
  | 'creator'
  | 'moderator'
  | 'admin'
  | 'super_admin'
  | 'partner'
  | 'sponsor_manager';

// Content types
export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  thumbnail: string;
  mediaUrl?: string;
  universe: Universe;
  status: PublishStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentType = 'video' | 'audio' | 'image' | 'article';
export type Universe =
  | 'reality'
  | 'creator'
  | 'lifestyle'
  | 'vertical'
  | 'movie'
  | 'games'
  | 'comedy'
  | 'sports';
export type PublishStatus = 'draft' | 'pending' | 'published' | 'archived';

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  bonusBalance: number;
  promoBalance: number;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  reference: string;
  createdAt: Date;
}

export type TransactionType = 'credit' | 'debit' | 'bonus' | 'promo' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

// Reward types
export interface RewardAccount {
  userId: string;
  points: number;
  level: number;
  streak: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export {
  ApiResponseWrapper,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createCreatedResponse,
  createNoContentResponse,
} from './api-response';

// Circuit Breaker types and utilities
export {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitState,
  createCircuitBreaker,
} from './circuit-breaker';
export type { CircuitBreakerOptions, CircuitBreakerStats } from './circuit-breaker';

// API Versioning types and utilities
export {
  ApiVersioningConfig,
  createVersionedResponse,
  API_VERSION_HEADER,
  API_VERSION_METADATA_KEY,
  DEFAULT_API_VERSION,
} from './api-versioning';
export type {
  ApiVersionOptions,
  VersionedResponse,
} from './api-versioning';

// Auth types
export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: ApiError;
}

// Payment types
export interface PaymentIntent {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  providerReference?: string;
  metadata?: Record<string, unknown>;
  completedAt?: Date;
  createdAt: Date;
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationType = 'system' | 'payment' | 'reward' | 'content' | 'social';

// Search types
export interface SearchQueryLog {
  id: string;
  query: string;
  count: number;
  lastSearchAt: Date;
  createdAt: Date;
}

// Analytics types
export interface ProductEvent {
  id: string;
  type: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
}

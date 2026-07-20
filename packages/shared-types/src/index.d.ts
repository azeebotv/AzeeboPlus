import type { ApiError } from './api-response-types';
/** Union of all granular permission strings used across the platform. */
export type Permission = 'user:read' | 'user:write' | 'user:manage' | 'content:read' | 'content:write' | 'content:moderate' | 'analytics:view' | 'analytics:export' | 'payment:view' | 'payment:refund' | 'admin:access' | 'settings:read' | 'settings:write';
export declare const PERMISSIONS_KEY = "permissions";
/** Maps each user role to its default set of permissions. */
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
/** Core user profile entity. */
export interface User {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    role: UserRole;
    isVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
/** All supported user roles in the platform. */
export type UserRole = 'user' | 'creator' | 'moderator' | 'admin' | 'super_admin' | 'partner' | 'sponsor_manager';
/** Standard authenticated request shape used across all services. */
export interface AuthenticatedRequest {
    user: {
        id: string;
        sub?: string;
        role?: string;
        email?: string;
    };
}
/** Response shape returned by login and register endpoints. */
export interface AuthResponse {
    success: boolean;
    data?: {
        user: User;
        access_token: string;
        refresh_token?: string;
    };
    error?: ApiError;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
}
export interface RefreshTokenRequest {
    refresh_token: string;
}
export interface MfaEnableRequest {
    method: 'totp' | 'sms';
    phone?: string;
}
export interface MfaVerifyRequest {
    code: string;
    tempToken?: string;
}
/** Universal content entity shared across all universes. */
export interface ContentItem {
    id: string;
    type: ContentType;
    title: string;
    description?: string;
    thumbnail: string;
    mediaUrl?: string;
    universe: Universe;
    universeId?: string;
    status: PublishStatus;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    duration?: number;
    category?: string;
    creatorId?: string;
    creatorName?: string;
    isPremium?: boolean;
    views?: number;
    creator?: {
        name: string;
    };
    tags?: {
        id: string;
        name: string;
    }[];
}
/** Supported content media types. */
export type ContentType = 'video' | 'audio' | 'image' | 'article' | 'document';
/** Platform universe categories. */
export type Universe = 'reality' | 'creator' | 'lifestyle' | 'vertical' | 'movie' | 'games' | 'comedy' | 'sports' | 'music';
export type PublishStatus = 'draft' | 'pending' | 'published' | 'archived';
export interface ContentCreateRequest {
    type: ContentType;
    title: string;
    description?: string;
    thumbnail?: string;
    mediaUrl?: string;
    universe: Universe;
    universeId?: string;
    status?: PublishStatus;
    metadata?: Record<string, unknown>;
    duration?: number;
    category?: string;
    isPremium?: boolean;
    tags?: string[];
}
export interface ContentUpdateRequest extends Partial<ContentCreateRequest> {
    id: string;
}
/** User wallet with balance and bonus/promo sub-accounts. */
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
export type TransactionType = 'credit' | 'debit' | 'bonus' | 'promo' | 'refund' | 'earning' | 'payout';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';
export interface WalletFundRequest {
    amount: number;
    paymentMethod: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money';
    provider: 'paystack' | 'flutterwave';
}
export interface WalletWithdrawRequest {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
}
export interface WalletTransferRequest {
    amount: number;
    recipientId: string;
    description?: string;
}
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
export interface RewardEarnRequest {
    activityType: string;
    contentId?: string;
    universe?: Universe;
}
export interface RewardRedeemRequest {
    points: number;
    rewardId: string;
}
/** Payment intent representing a pending or completed financial transaction. */
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
export interface PaymentInitiateRequest {
    amount: number;
    currency?: string;
    email: string;
    description?: string;
    metadata?: Record<string, unknown>;
    provider: 'paystack' | 'flutterwave';
    returnUrl: string;
}
export interface PaymentVerifyRequest {
    reference: string;
    provider: 'paystack' | 'flutterwave';
}
export interface PaymentWebhookPayload {
    event: string;
    data: {
        id: string;
        status?: string;
        amount?: number;
        currency?: string;
        metadata?: Record<string, unknown>;
    };
}
/** User notification entity. */
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
export interface NotificationCreateRequest {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    types: Record<NotificationType, boolean>;
}
export interface SearchQueryLog {
    id: string;
    query: string;
    count: number;
    lastSearchAt: Date;
    createdAt: Date;
}
export interface SearchRequest {
    q: string;
    universe?: Universe;
    type?: ContentType;
    page?: number;
    limit?: number;
}
export interface SearchResult {
    id: string;
    type: ContentType;
    title: string;
    description?: string;
    thumbnail: string;
    universe: Universe;
    relevanceScore: number;
}
export interface ProductEvent {
    id: string;
    eventName: string;
    userId?: string;
    sessionId?: string;
    platform?: string;
    universe?: Universe;
    timestamp: Date;
    createdAt: Date;
    deviceInfo?: DeviceInfo;
    appVersion?: string;
    experimentFlags?: Record<string, string>;
    metadata?: Record<string, unknown>;
}
export interface DeviceInfo {
    deviceType: string;
    os: string;
    osVersion?: string;
    browser?: string;
    browserVersion?: string;
    appVersion?: string;
    screenWidth?: number;
    screenHeight?: number;
    language: string;
    timezone: string;
    userAgent?: string;
}
export interface AnalyticsEventRequest {
    eventName: string;
    userId?: string;
    sessionId?: string;
    platform?: string;
    universe?: Universe;
    timestamp?: Date;
    deviceInfo?: DeviceInfo;
    appVersion?: string;
    experimentFlags?: Record<string, string>;
    metadata?: Record<string, unknown>;
}
export interface FunnelAnalyticsRequest {
    funnelName: string;
    startDate: Date;
    endDate: Date;
    universe?: Universe;
}
export interface CohortAnalyticsRequest {
    cohortType: string;
    startDate: Date;
    endDate: Date;
    granularity: 'day' | 'week' | 'month';
}
export interface RecommendationRequest {
    userId?: string;
    limit?: number;
    universe?: Universe;
    contentType?: ContentType;
    freshnessDays?: number;
}
export interface RecommendationItem {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    creator: {
        id: string;
        displayName: string;
        avatar: string;
    };
    universe: {
        id: string;
        name: string;
        slug: string;
    };
    score: number;
    explainability: {
        factors: {
            name: string;
            weight: number;
        }[];
        reason: string;
    };
    freshnessScore: number;
}
export interface CreatorProfile {
    id: string;
    userId: string;
    displayName: string;
    bio?: string;
    avatar?: string;
    verificationStatus: VerificationStatus;
    subscriberCount: number;
    totalViews: number;
    totalEarnings: number;
    createdAt: Date;
}
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export interface CreatorOnboardingRequest {
    displayName: string;
    bio?: string;
    category: string;
    socialLinks?: Record<string, string>;
}
export interface CreatorStats {
    totalSubscribers: number;
    totalContentItems: number;
    totalViews: number;
    totalEarnings: number;
    averageEngagementRate: number;
    topContent: ContentItem[];
}
export interface ModerationReport {
    id: string;
    reporterId: string;
    contentId?: string;
    userId?: string;
    reason: string;
    details?: string;
    status: ModerationStatus;
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export type ModerationStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export interface ModerationAction {
    id: string;
    reportId: string;
    action: ModerationActionType;
    moderatorId: string;
    reason?: string;
    createdAt: Date;
}
export type ModerationActionType = 'content_removed' | 'user_warned' | 'user_suspended' | 'user_banned' | 'content_restored' | 'report_dismissed';
export interface ModerationDecisionRequest {
    reportId: string;
    action: ModerationActionType;
    reason?: string;
}
/** Key-value metadata for paginated list responses. */
export type { ApiResponse, ApiError, PaginationMeta } from './api-response-types';
/** Wrapper factory and helpers for building consistent API responses. */
export { ApiResponseWrapper, 
/** Creates a successful API response with data. */
createSuccessResponse, 
/** Creates an error API response with an ApiError. */
createErrorResponse, 
/** Creates a paginated API response with meta. */
createPaginatedResponse, 
/** Creates a 201 Created API response. */
createCreatedResponse, 
/** Creates a 204 No Content API response. */
createNoContentResponse, } from './api-response';
/** Circuit breaker for preventing cascading failures in service calls. */
export { CircuitBreaker, CircuitBreakerOpenError, CircuitState, createCircuitBreaker, } from './circuit-breaker';
export type { CircuitBreakerOptions, CircuitBreakerStats } from './circuit-breaker';
export { ApiVersioningConfig, createVersionedResponse, API_VERSION_HEADER, API_VERSION_METADATA_KEY, DEFAULT_API_VERSION, } from './api-versioning';
export type { ApiVersionOptions, VersionedResponse } from './api-versioning';
export { environmentSchema, validateEnvironment } from './env-validation';
export type { EnvironmentVariables } from './env-validation';
export { getPricing } from './pricing';
export type { PricingPlan, WalletPricing, ContentPricing } from './pricing';
/** Validates environment variables and secrets at service startup. */
export { validateStartup, isPlaceholderSecret, validateNoPlaceholders } from './secret-validation';
export { DataClassification, PiiCategory, ConsentType, AuditLogEntry } from './data-classification';
export type { DataClassificationMetadata, UserDataExport, UserDataDeletionRequest, RetentionPolicy, } from './data-classification';
export type { PrivacyPolicy, PrivacyPolicySection, PrivacyPolicyAcceptance, ConsentAuditLog, } from './privacy-policy';
export interface UniverseKpi {
    universe: Universe;
    totalUsers: number;
    activeUsers: number;
    totalContentItems: number;
    totalViews: number;
    totalRevenue: number;
    engagementRate: number;
    period: {
        start: Date;
        end: Date;
    };
}
export interface PredictionMarket {
    id: string;
    universe: Universe;
    question: string;
    description?: string;
    odds: Record<string, number>;
    stakes: number;
    status: 'open' | 'closed' | 'settled';
    startDate: Date;
    endDate: Date;
    result?: string;
}
export interface GameSession {
    id: string;
    universe: Universe;
    gameType: string;
    status: 'active' | 'completed' | 'abandoned';
    score?: number;
    startedAt: Date;
    completedAt?: Date;
}
export interface ComedySpecial {
    id: string;
    title: string;
    comedian: string;
    description?: string;
    thumbnail: string;
    mediaUrl?: string;
    duration?: number;
    isPremium: boolean;
    releaseDate: Date;
    ratings: {
        average: number;
        count: number;
    };
}
export interface MovieListing {
    id: string;
    title: string;
    description?: string;
    thumbnail: string;
    mediaUrl?: string;
    duration?: number;
    genre: string[];
    rating: string;
    releaseDate: Date;
    isPremium: boolean;
    cinemaPassRequired: boolean;
}
export interface SportsFixture {
    id: string;
    universe: Universe;
    homeTeam: string;
    awayTeam: string;
    startDate: Date;
    status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';
    homeScore?: number;
    awayScore?: number;
    venue?: string;
    metadata?: Record<string, unknown>;
}
export interface FanContest {
    id: string;
    universe: Universe;
    name: string;
    description?: string;
    entryFee: number;
    prizePool: number;
    maxParticipants: number;
    currentParticipants: number;
    startDate: Date;
    endDate: Date;
    status: 'upcoming' | 'open' | 'closed' | 'completed';
}
/** User subscription with tier, status, and billing period. */
export interface Subscription {
    id: string;
    userId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    providerSubscriptionId?: string;
}
export type SubscriptionTier = 'basic' | 'premium' | 'vip';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing';
export interface SubscriptionCreateRequest {
    tier: SubscriptionTier;
    paymentMethodId: string;
    provider: 'paystack' | 'flutterwave';
}
export interface SubscriptionCancelRequest {
    immediately: boolean;
}
/** Platform-specific token storage adapter for persisting auth tokens. */
export interface TokenStorage {
    getAccessToken(): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    setAccessToken(token: string): Promise<void>;
    setRefreshToken(token: string): Promise<void>;
    clearTokens(): Promise<void>;
}
/** Structured logger interface for services and apps. */
export interface Logger {
    log: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, trace?: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
}

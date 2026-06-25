export type { User, AuthResponse, ApiResponse } from './auth';
export type { ContentItem, PaginatedResponse } from './content';
export type { WalletBalance, Transaction } from './wallet';
export type { Notification, NotificationPreferences } from './notification';
export type { MediaUploadResponse, PresignedUploadResponse, FileMetadata } from './media';
export type { Universe } from './universe';
export type { Conversation, Message, LiveChatMessage } from './messaging';
export type { LeaderboardEntry, RankingCategory, PredictionResult } from './engagement';
export type { CreatorProfile, CreatorDashboard, CreatorEarnings } from './creator';
export type { SupportTicket, CreateTicketData } from './support';
export type { Recommendation } from './recommendation';

export { authApi } from './auth';
export { contentApi } from './content';
export { walletApi } from './wallet';
export { paymentApi } from './payment';
export { notificationApi } from './notification';
export { mediaApi } from './media';
export { universeApi } from './universe';
export { userApi } from './user';
export { subscriptionApi } from './subscription';
export { messagingApi, chatApi } from './messaging';
export { engagementApi, realityApi, homepageEngagementApi } from './engagement';
export type {
  EngagementHistoryItem,
  UserUniverseEngagement,
  RecommendationGroup as HomepageRecommendationGroup,
} from './engagement';
export { referralApi } from './referral';
export { creatorApi } from './creator';
export { supportApi } from './support';
export { apiClient } from './client';

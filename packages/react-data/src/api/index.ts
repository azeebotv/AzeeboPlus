export type {
  User,
  AuthResponse,
  ApiResponse,
  Device,
  SelectRoleResponse,
  SelectableRole,
} from './auth';
export type {
  DeviceLinkInitResponse,
  DeviceLinkStatus,
  DeviceLinkPollResponse,
  DeviceLinkConfirmResponse,
  DeviceLinkDenyResponse,
  PollFailureClass,
} from './device-auth';
export { classifyPollFailure } from './device-auth';
export type { ContentItem, PaginatedResponse } from './content';
export type { WalletBalance, Transaction } from './wallet';
export type { Notification, NotificationPreferences } from './notification';
export type {
  MediaUploadResponse,
  PresignedUploadResponse,
  FileMetadata,
  UploadCachePolicy,
} from './media';
export type { Universe } from './universe';
export type { Conversation, Message, LiveChatMessage } from './messaging';
export type { LeaderboardEntry, RankingCategory, PredictionResult } from './engagement';
export type { CreatorProfile, CreatorDashboard, CreatorEarnings } from './creator';
export type { SupportTicket, CreateTicketData } from './support';
export type { Recommendation } from './recommendation';

export { authApi } from './auth';
export { deviceAuthApi } from './device-auth';
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
export { moderationApi } from './moderation';
export { apiClient } from './client';
export type {
  ReportReason,
  ReportData,
  Report,
  Challenge,
  ChallengeSubmission,
  Subscriber,
  SubscriberStats,
  CreatorSubscriberData,
} from './moderation';

// Unified API object for convenience
import { authApi } from './auth';
import { contentApi } from './content';
import { walletApi } from './wallet';
import { paymentApi } from './payment';
import { notificationApi } from './notification';
import { mediaApi } from './media';
import { universeApi } from './universe';
import { userApi } from './user';
import { subscriptionApi } from './subscription';
import { messagingApi, chatApi } from './messaging';
import { engagementApi, realityApi, homepageEngagementApi } from './engagement';
import { referralApi } from './referral';
import { creatorApi } from './creator';
import { supportApi } from './support';
import { moderationApi } from './moderation';

export const api = {
  auth: authApi,
  content: contentApi,
  wallet: walletApi,
  payment: paymentApi,
  notification: notificationApi,
  media: mediaApi,
  universe: universeApi,
  user: userApi,
  subscription: subscriptionApi,
  messaging: messagingApi,
  chat: chatApi,
  engagement: engagementApi,
  reality: realityApi,
  homepageEngagement: homepageEngagementApi,
  referral: referralApi,
  creator: creatorApi,
  support: supportApi,
  moderation: moderationApi,
  recommendation: {
    getForYou: (limit: number) => homepageEngagementApi.getNewReleases(limit),
    getTrending: (limit: number) => contentApi.getTrendingContent(limit),
  },
};

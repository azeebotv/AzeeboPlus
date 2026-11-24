export interface RecentContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  viewCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalViews: number;
  subscribers: number;
  totalEarnings: number;
  contentCount: number;
  viewsChange: string;
  subscribersChange: string;
  earningsChange: string;
  contentChange: string;
  recentContent?: RecentContentItem[];
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'audio' | 'document';
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  mediaUrl: string | null;
  creatorId: string;
  universeId: string;
  isExclusive: boolean;
  isPremiere: boolean;
  metadata: unknown;
  publishedAt: string | null;
  releaseDate: string | null;
}

export interface ContentList {
  items: ContentItem[];
  total: number;
}

export interface AnalyticsData {
  totalViews: number;
  avgWatchTime: string;
  engagementRate: number;
  newSubscribers: number;
  viewsOverTime: { date: string; views: number }[];
  demographics: { region: string; percentage: number }[];
  topContent: { title: string; views: number; engagement: string }[];
}

export interface EarningsData {
  total: number;
  count: number;
  pendingPayout: number;
  lifetimeEarnings: number;
}

export interface EarningsSummaryData extends EarningsData {
  lastPayout: number;
}

export interface EarningsEntry {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  createdAt: string;
}

export interface EarningsHistoryData {
  items: EarningsEntry[];
  total: number;
}

export interface PayoutRequest {
  success: boolean;
  message: string;
}

export interface PayoutSettings {
  method?: string;
  minimum?: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'subscribers';
  showEarnings: boolean;
  allowMessages: boolean;
}

export interface CreatorSettings {
  payoutMethod?: string;
  minimumPayout?: number;
  notifications?: NotificationPreferences;
  privacy?: PrivacySettings;
}

// Payouts
export interface PayoutItem {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
}

export interface PayoutsData {
  availableBalance: number;
  pendingPayout: number;
  totalPaidOut: number;
  history: PayoutItem[];
}

// Subscribers
export interface Subscriber {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  tier: string;
  joinedAt: string;
}

export interface SubscribersData {
  total: number;
  growth: { date: string; count: number }[];
  demographics: { region: string; percentage: number }[];
  recentSubscribers: Subscriber[];
}

// Upload
export interface UploadProgress {
  id: string;
  title: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  /** Where the file bytes live: blob storage ('stored') or metadata-only ('pending'). */
  storage: 'stored' | 'pending' | 'unknown';
  /** media-service virus scan verdict, when the pipeline stored the file. */
  scanStatus: string | null;
}

// Monetization
export interface MonetizationTier {
  id: string;
  name: string;
  price: number;
  subscriberCount: number;
  perks: string[];
  isActive?: boolean;
}

export interface MonetizationData {
  tipEnabled: boolean;
  tipMin: number;
  tipMax: number;
  payoutMethod: string;
  payoutDetails: Record<string, string>;
  /** Optional: present when the backend exposes subscription tiers. */
  tiers?: MonetizationTier[];
  // Mobile app aliases
  isTipEnabled?: boolean;
  minimumTip?: number;
  isMonetizationEnabled?: boolean;
  isSubscriptionEnabled?: boolean;
  subscriptionPrice?: number;
  isAdEnabled?: boolean;
  adRevenueShare?: number;
}

// Challenges
export interface Challenge {
  id: string;
  title: string;
  description: string;
  universe: string;
  prize: number;
  deadline: string;
  submissionsCount: number;
  status: 'active' | 'upcoming' | 'ended';
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  title: string;
  status: 'submitted' | 'under_review' | 'winner' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  /** Moderator's note to the creator (e.g. rejection reason), synced from upstream. */
  reviewNote: string | null;
}

/** One transition in a submission's review history (append-only log). */
export interface SubmissionReviewEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  note: string | null;
  createdAt: string;
}

/** Full payload behind the submission detail view. */
export interface SubmissionDetail {
  submission: {
    id: string;
    challengeId: string;
    title: string;
    status: string;
    submittedAt: string;
    reviewedAt: string | null;
    reviewedByName: string | null;
    reviewNote: string | null;
    hasAttachedContent: boolean;
  };
  challenge: { id: string; title: string; prize: number | null; ended: boolean } | null;
  history: SubmissionReviewEvent[];
  content: {
    id: string;
    title: string;
    type: string;
    status: string;
    playbackUrl: string | null;
    playbackKind: 'signed' | 'premium' | null;
    expiresIn: number | null;
    playbackError: string | null;
  } | null;
  prizePayout: {
    prize: number | null;
    status: 'awaiting_payout' | 'partially_paid' | 'paid' | 'none';
    label: string;
    totalPaid: number;
    payoutIds: string[];
  } | null;
}

// Profile
export interface CreatorProfile {
  id: string;
  userId: string;
  displayName?: string;
  email?: string;
  avatar?: string | null;
  website?: string;
  bio: string | null;
  banner: string | null;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  } | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

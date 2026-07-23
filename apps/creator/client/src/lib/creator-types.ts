export interface DashboardStats {
  totalViews: number;
  subscribers: number;
  totalEarnings: number;
  contentCount: number;
  viewsChange: string;
  subscribersChange: string;
  earningsChange: string;
  contentChange: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
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
  email: string;
  avatar: string;
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
}

// Monetization
export interface MonetizationTier {
  id: string;
  name: string;
  price: number;
  perks: string[];
  subscriberCount: number;
}

export interface MonetizationData {
  tiers: MonetizationTier[];
  tipEnabled: boolean;
  tipMin: number;
  tipMax: number;
  payoutMethod: string;
  payoutDetails: Record<string, string>;
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
}

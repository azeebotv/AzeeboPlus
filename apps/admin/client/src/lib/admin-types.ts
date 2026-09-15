export interface PlatformOverview {
  totalUsers: number;
  totalContent: number;
  totalViews: number;
  dailyActiveUsers: number;
  dailyViews: number;
  totalRevenue: number;
  newUsers: number;
  newContent: number;
  topCreators: {
    id: string;
    name: string;
    contentCount: number;
    views: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    user: string;
    time: string;
  }[];
}

export interface AdminWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended';
  user?: { id: string; email: string; displayName: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreator {
  id: string;
  userId: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  contentCount: number;
  subscriberCount: number;
  isVerified: boolean;
  createdAt: string;
}

export interface PaymentGateway {
  id: string;
  provider: string;
  name: string;
  mode: 'live' | 'test';
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RealityShow {
  id: string;
  title: string;
  description?: string;
  /** ContentItem status of the underlying row (reality universe). */
  status: string;
  creator?: { id: string; displayName: string; email: string };
  mediaUrl?: string;
  isExclusive?: boolean;
  isPremiere?: boolean;
  viewCount?: number;
  publishedAt?: string;
  createdAt: string;
}

export interface ContentReviewItem {
  id: string;
  contentId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  flaggedReasons: string[];
  creatorName?: string;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  retentionRate: number;
  bounceRate: number;
}

export interface EngagementTrend {
  date: string;
  metric: string;
  value: number;
}

export interface SearchCorrectionDay {
  date: string;
  shown: number;
  accepted: number;
  /** accepted / shown for that day (0 when nothing was shown). */
  rate: number;
}

export interface SearchCorrectionsData {
  days: number;
  overall: {
    shown: number;
    accepted: number;
    rate: number;
  };
  series: SearchCorrectionDay[];
}

export interface SearchFuzzyStatus {
  enabled: boolean;
  pgTrgm: 'available' | 'missing' | 'unknown';
  indexes: 'present' | 'missing' | 'unknown';
  degraded: boolean;
  warning?: string;
  mode: 'fuzzy' | 'exact';
  lastProbeAt: string | null;
}

export interface SearchStats {
  totalSearchesToday: number;
  uniqueSearchers: number;
  topQueries: unknown[];
  /** Fuzzy-search guard state — same shape as GET /health's search object. */
  fuzzy: SearchFuzzyStatus;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface AdminReport {
  id: string;
  name: string;
  description?: string;
  category: string;
  dateRange: string;
  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  dateField: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportMetric {
  name: string;
  aggregation: string;
  field: string;
}

export interface ReportDimension {
  field: string;
  label: string;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface AdminUniverse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isEnabled: boolean;
  sortOrder: number;
  contentCount?: number;
  metadata?: Record<string, unknown>;
  featureFlags?: FeatureFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  featureKey: string;
  isEnabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface GlobalFeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userIds?: string[];
  description?: string;
  metadata?: Record<string, unknown>;
  /** Non-boolean payload (e.g. queue_dlq_retry_base_delay_ms in ms). */
  value?: string | number | boolean | null;
  owner?: string;
  staleAfter?: string;
  /** ISO timestamp of when the stale sweep last notified the owner. */
  staleNotifiedAt?: string;
  /** ISO timestamp when the self-disable safety auto-turned this flag off
   *  (past staleAfter + grace). Cleared when ops renews the expiry. */
  autoDisabledAt?: string;
  isPublic?: boolean;
  lastToggledBy?: string;
}

/** The most recent nightly stale-flag pass (audit-recorded) — times, counts,
 *  and webhook status, for the Global Flags page's "last run" panel. */
export interface LastNightlyRun {
  ranAt: string;
  staleCount: number;
  universeStaleCount: number;
  notifiedCount: number;
  autoPruned: number;
  autoPrunedUniverse: number;
  /** Present only when the pass ran in universe dry-run mode. */
  wouldPruneUniverse?: number;
  dryRunUniverse?: boolean;
  /** Set to 'no-webhook' when the pass blocked auto-prune (webhook missing). */
  pruneBlocked?: 'no-webhook';
  webhook: 'posted' | 'skipped-empty' | 'no-webhook' | 'failed';
}

/** Per-key Prometheus flag_stale_running_total + flag_auto_disabled_total
 *  joined into the stale report. */
export interface StaleFlagMetrics {
  available: boolean;
  fetchedAt: string | null;
  /** key → lifetime count + evaluations/min over the last 5 minutes. */
  staleRunning: Record<string, { total: number; rate5m: number }>;
  /** key → lifetime count of self-disable flips by the safety. */
  autoDisabled: Record<string, { total: number }>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationDays: number;
  tier: 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'archived';
  features: string[];
  maxContentAccess?: number;
  maxUsers?: number;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  activePlans: number;
}

export interface Storyworld {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  isPublished: boolean;
  characterCount: number;
  pathCount: number;
  /** vertical-service returns locationCount instead of pathCount. */
  locationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgbalaCharacter {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  path: string;
  backstory?: string;
  storyworldId: string;
  storyworldTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgbalaPath {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  totalSteps: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgbalaQuiz {
  id: string;
  title: string;
  description?: string;
  storyworldId?: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  category?: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundlePassAdmin {
  id: string;
  name: string;
  description: string;
  universeIds: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  duration: number;
  isActive: boolean;
  tier: 'standard' | 'premium' | 'ultimate';
  createdAt: string;
  updatedAt: string;
  _count?: { subscriptions: number };
}

export interface LiveEventAdmin {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  organizerId: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  ticketPrice: number;
  currency: string;
  maxViewers?: number;
  currentViewers: number;
  streamUrl?: string;
  replayUrl?: string;
  chatEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { tickets: number };
}

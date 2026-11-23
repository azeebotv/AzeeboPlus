/** Dual-control request row (TAA §55). Mirrors the backend DTO. */
export interface DualControlRequest {
  id: string;
  actionType: string;
  description: string;
  requestedBy: string;
  requestedByName?: string | null;
  amount?: string | null;
  currency?: string | null;
  targetUserIds?: string[];
  status: 'pending' | 'first_approved' | 'approved' | 'rejected' | 'executed' | string;
  firstApprover?: string | null;
  firstApproverName?: string | null;
  secondApprover?: string | null;
  secondApproverName?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

/** Rights clearance row. Mirrors the backend DTO. */
export interface RightsClearance {
  id: string;
  talentName: string;
  type: string;
  contentId: string;
  contentTitle: string;
  universe: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | string;
  expiryDate: string | null;
  clearanceScope: string;
  regions: string[];
  notes: string;
  createdAt: string;
}

export interface PlatformOverview {
  totalUsers: number;
  totalContent: number;
  totalViews: number;
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
  email?: string;
  walletBalance?: number;
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
  thumbnail?: string;
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

/** Challenge entry in the admin review queue (from creator-service). */
export interface ChallengeEntryReviewItem {
  id: string;
  challengeId: string;
  challengeTitle: string;
  prize: string | null;
  participantId: string;
  participantName: string;
  participantEmail: string | null;
  contentUrl: string;
  status: 'pending' | 'under_review' | 'winner' | 'rejected';
  reviewedAt: string | null;
  reviewedBy: string | null;
  /** Moderator's note to the participant (rejection reason, feedback, …). */
  reviewNote: string | null;
  createdAt: string;
}

/**
 * Real engagement metrics — exactly what the engagement-admin backend
 * computes (never invented fields). `activeUsers` is wallets with a
 * completed transaction this week; there is no session/DAU source, so no
 * DAU/retention/bounce numbers are claimed.
 */
export interface EngagementMetrics {
  totalViews: number;
  totalContent: number;
  activeUsers: number;
  newUsersThisWeek: number;
  dailyTransactions: number;
}

export interface EngagementTrend {
  date: string;
  newUsers: number;
  publishedContent: number;
  draftContent: number;
}

/** Aggregate wallet stats from /admin/wallets/stats. */
export interface WalletStats {
  totalWallets: number;
  totalBalance: number;
  totalBonus: number;
  totalPromo: number;
  todayTransactions: number;
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

/**
 * Approved lending partner shown on the public Borrow page. Money and rate
 * columns are Prisma Decimals, which serialize to decimal STRINGS — read them
 * with num() for display and never do arithmetic on the parsed value.
 */
export interface PartnerBankAdmin {
  id: string;
  slug: string;
  name: string;
  productName: string | null;
  logoUrl: string | null;
  licenceRef: string | null;
  registrationNumber: string | null;
  minAmount: string;
  maxAmount: string;
  minTenorMonths: number;
  maxTenorMonths: number;
  interestRateMin: string;
  interestRateMax: string;
  feeDisclosure: string | null;
  totalCostExample: string | null;
  eligibility: string | null;
  applyUrl: string;
  termsUrl: string | null;
  privacyUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  /** Dev/placeholder row — the public page labels it as sample data. */
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
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

// ─── Payout Requests (G7 — Financial) ─────────────────────────────────────────

export interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  /** pending | approved | rejected | completed | failed | cancelled */
  status: string;
  method: string;
  metadata?: Record<string, unknown>;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Joined from users FDW table when available */
  user?: { displayName: string; email: string };
}

export interface PayoutStats {
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
  completed: number;
  completedAmount: number;
  rejected: number;
}

// ─── Tipping Config (G2 — Tipping) ────────────────────────────────────────────

export interface TippingConfig {
  platformCommissionPct: number;
  maxTipAmount: number;
  currency: string;
  updatedAt?: string;
}

// ─── Promo Codes (G3 — Subscriptions) ─────────────────────────────────────────

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  /** active | expired | deleted */
  status: string;
  applicablePlanIds: string[];
  createdAt: string;
}

// ─── Webhook Events (G4 — Payment Gateways) ───────────────────────────────────

export interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  reference: string;
  amount: number;
  currency: string;
  /** success | failed | pending */
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Support Tickets (G6 — Support) ───────────────────────────────────────────

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  /** open | in_progress | resolved | closed */
  status: string;
  /** low | medium | high | urgent */
  priority: string;
  category: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName?: string;
  authorRole?: string;
  body: string;
  createdAt: string;
}

export interface SupportStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResponseTimeMs?: number;
}

// ─── Lifestyle guides (9TLIFE catalogs, admin CRUD) ─────────────────────────

export interface ItineraryStop {
  id: string;
  itineraryId: string;
  name: string;
  description: string;
  duration: string;
  order: number;
}

export interface Itinerary {
  id: string;
  title: string;
  slug: string;
  description: string;
  city: string;
  duration: string;
  rating: number;
  /** draft | published | archived */
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  stops?: ItineraryStop[];
}

export interface NeighborhoodPlace {
  id: string;
  neighborhoodId: string;
  name: string;
  category: string;
  rating: number;
  address?: string | null;
}

export interface Neighborhood {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string;
  image?: string | null;
  /** draft | published | archived */
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  places?: NeighborhoodPlace[];
}

export interface PartnerOffer {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  terms: string[];
  validUntil: string;
  /** active | expired | archived */
  status: string;
  createdAt: string;
  updatedAt: string;
  partner?: { id: string; name: string; slug: string; category: string };
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  description: string;
  rating: number;
  address?: string | null;
  phone?: string | null;
  /** draft | published | archived */
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  offers?: PartnerOffer[];
}

// ─── Navigation Menus (Superadmin Menu Management) ───────────────────────────

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  isVisible: boolean;
  order: number;
  badge?: string;
  target?: string;
  roles?: string[];
}

export interface NavigationMenu {
  id: string;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  items: MenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── ACDP Package Validation ─────────────────────────────────────────────────

export interface AcdpComponentStatus {
  component: string;
  status: 'valid' | 'invalid' | 'missing' | 'warning';
  details?: string;
}

export interface AcdpPackageItem {
  id: string;
  contentId: string;
  title: string;
  universe: string;
  version: string;
  status: 'draft' | 'under_review' | 'compliant' | 'rejected' | 'published';
  universeFitScore: number;
  masterVideoValid: boolean;
  verticalDerivativeValid: boolean;
  audioTracksValid: boolean;
  subtitlesValid: boolean;
  talentClearanceStatus: 'cleared' | 'pending' | 'flagged';
  aiDisclosureStatus: 'disclosed' | 'not_applicable' | 'undisclosed';
  components: AcdpComponentStatus[];
  submittedAt: string;
  submittedBy: string;
}

export interface AcdpValidationResult {
  packageId: string;
  isCompliant: boolean;
  universeFitScore: number;
  errors: string[];
  warnings: string[];
}


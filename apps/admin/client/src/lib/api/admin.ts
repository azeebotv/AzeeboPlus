import { apiFetch } from './base';
import type {
  PlatformOverview,
  DualControlRequest,
  RightsClearance,
  AdminWallet,
  AdminCreator,
  PaymentGateway,
  RealityShow,
  ContentReviewItem,
  ChallengeEntryReviewItem,
  EngagementMetrics,
  EngagementTrend,
  SearchCorrectionsData,
  SearchStats,
  NotificationTemplate,
  NotificationStats,
  AdminUniverse,
  Storyworld,
  AgbalaCharacter,
  AgbalaQuiz,
  FeatureFlag,
  GlobalFeatureFlag,
  StaleFlagMetrics,
  LastNightlyRun,
  SystemSetting,
  SubscriptionPlan,
  SubscriptionStats,
  WalletStats,
  LiveEventAdmin,
  BundlePassAdmin,
  PartnerBankAdmin,
  PayoutRequest,
  PayoutStats,
  TippingConfig,
  PromoCode,
  WebhookEvent,
  SupportTicket,
  SupportStats,
  Itinerary,
  Neighborhood,
  Partner,
  PartnerOffer,
  MenuItem,
  NavigationMenu,
} from '../admin-types';

export interface DashboardStats {
  totalUsers: number;
  totalContent: number;
  totalViews: number;
  totalRevenue: number;
  newUsers: number;
}

export interface UserListResponse {
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    avatar?: string;
    createdAt: string;
    isActive?: boolean;
    suspensionStatus?: string;
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ContentListResponse {
  items: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    type?: string;
    views?: number;
    createdAt: string;
    creator?: { id: string; name: string; avatar?: string };
    universe?: { id: string; name: string };
    categories?: Array<{ id: string; name: string }>;
    tags?: Array<{ id: string; name: string }>;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogEntry {
  /** Which trail the row came from: 'admin' (panel events) or 'auth-service' (federated login/token events). */
  source?: 'admin' | 'auth-service';
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export const adminApi = {
  // ─── Dashboard ──────────────────────────────────────────────────────────
  getDashboard: () => apiFetch<DashboardStats>('/api/v1/admin/dashboard/stats'),
  getDashboardRevenue: (days = 30) =>
    apiFetch<Array<{ date: string; revenue: number }>>(
      `/api/v1/admin/dashboard/revenue?days=${days}`
    ),
  getPlatformOverview: () => apiFetch<PlatformOverview>('/api/v1/admin/overview'),
  getGovernanceSummary: () =>
    apiFetch<{
      pendingDualControl: number;
      approvedNotExecuted: number;
      expiringClearances: number;
      expiredClearances: number;
    }>('/api/v1/admin/dashboard/governance-summary'),
  getDualControlRequests: (status?: string) =>
    apiFetch<{
      actions: DualControlRequest[];
      stats: Record<string, number>;
    }>(`/api/v1/admin/dual-control${status && status !== 'all' ? `?status=${status}` : ''}`),
  decideDualControl: (id: string, decision: 'approve' | 'reject', reason?: string) =>
    apiFetch<DualControlRequest>(`/api/v1/admin/dual-control/${id}/${decision}`, {
      method: 'POST',
      ...(decision === 'reject' ? { body: JSON.stringify({ reason }) } : {}),
    }),
  getRightsClearances: (
    filters: { status?: string; type?: string; q?: string; expiry?: string } = {}
  ) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.q) params.set('q', filters.q);
    if (filters.expiry && filters.expiry !== 'all') params.set('expiry', filters.expiry);
    const qs = params.toString();
    return apiFetch<RightsClearance[]>(`/api/v1/admin/rights/clearances${qs ? `?${qs}` : ''}`);
  },
  decideRightsClearance: (id: string, status: 'approved' | 'rejected') =>
    apiFetch<RightsClearance>(`/api/v1/admin/rights/clearances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // ─── Users ──────────────────────────────────────────────────────────────
  getUsers: (page = 1, limit = 20, role?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.set('role', role);
    if (search) params.set('search', search);
    return apiFetch<UserListResponse>(`/api/v1/admin/users?${params}`);
  },
  getUserById: (id: string) => apiFetch<unknown>(`/api/v1/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    apiFetch<unknown>(`/api/v1/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  suspendUser: (id: string, reason: string, durationDays?: number) =>
    apiFetch<unknown>(`/api/v1/admin/users/${id}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ reason, durationDays }),
    }),
  createUser: (data: {
    email: string;
    displayName: string;
    password?: string;
    role?: string;
    isVerified?: boolean;
  }) => apiFetch<unknown>('/api/v1/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (
    id: string,
    data: {
      displayName?: string;
      email?: string;
      role?: string;
      isVerified?: boolean;
    }
  ) =>
    apiFetch<unknown>(`/api/v1/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) => apiFetch<unknown>(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),
  revokeSuspension: (id: string, reason: string) =>
    apiFetch<unknown>(`/api/v1/admin/users/${id}/suspension/revoke`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  // ─── Content ────────────────────────────────────────────────────────────
  getContentList: (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      universeId?: string;
    } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    if (params.universeId) q.set('universeId', params.universeId);
    return apiFetch<ContentListResponse>(`/api/v1/admin/content?${q}`);
  },
  getContentItem: (id: string) => apiFetch<unknown>(`/api/v1/admin/content/${id}`),
  createContent: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/content', { method: 'POST', body: JSON.stringify(data) }),
  updateContent: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContent: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/content/${id}`, { method: 'DELETE' }),
  publishContent: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/content/${id}/publish`, { method: 'POST' }),
  unpublishContent: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/content/${id}/unpublish`, { method: 'POST' }),
  bulkUpdateStatus: (ids: string[], status: string) =>
    apiFetch<unknown>('/api/v1/admin/content/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),
  bulkDelete: (ids: string[]) =>
    apiFetch<unknown>('/api/v1/admin/content/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  getContentCategories: () =>
    apiFetch<Array<{ id: string; name: string }>>('/api/v1/admin/content/categories'),
  createContentCategory: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/content/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContentCategory: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/content/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteContentCategory: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/content/categories/${id}`, { method: 'DELETE' }),
  getContentTags: () => apiFetch<Array<{ id: string; name: string }>>('/api/v1/admin/content/tags'),
  createContentTag: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/content/tags', { method: 'POST', body: JSON.stringify(data) }),
  deleteContentTag: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/content/tags/${id}`, { method: 'DELETE' }),
  getContentStats: () => apiFetch<unknown>('/api/v1/admin/content/stats'),

  // ─── Content Review ─────────────────────────────────────────────────────
  getContentReviewQueue: (page = 1, limit = 20) =>
    apiFetch<{ items: ContentReviewItem[]; total: number }>(
      `/api/v1/admin/content-review?page=${page}&limit=${limit}`
    ),
  approveContent: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/content-review/${id}/approve`, { method: 'POST' }),
  rejectContent: (id: string, reason: string) =>
    apiFetch<unknown>(`/api/v1/admin/content-review/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // ─── Challenge Entry Review ────────────────────────────────────────────
  getChallengeEntryQueue: (filters: { status?: string; challengeId?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v) as [string, string][]
    ).toString();
    return apiFetch<{ items: ChallengeEntryReviewItem[] }>(
      `/api/v1/creator-entries${qs ? `?${qs}` : ''}`
    );
  },
  reviewChallengeEntry: (
    entryId: string,
    action: 'under_review' | 'winner' | 'rejected',
    note?: string
  ) =>
    apiFetch<{ entryId: string; status: string; reviewedAt: string; reviewNote: string | null }>(
      `/api/v1/creator-entries/${entryId}/review`,
      { method: 'PATCH', body: JSON.stringify({ action, ...(note ? { note } : {}) }) }
    ),

  // ─── Wallets ────────────────────────────────────────────────────────────
  getWallets: (page = 1, limit = 20) =>
    apiFetch<{ items: AdminWallet[]; total: number }>(
      `/api/v1/admin/wallets?page=${page}&limit=${limit}`
    ),
  updateWalletStatus: (id: string, status: string) =>
    apiFetch<unknown>(`/api/v1/admin/wallets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // ─── Creators ───────────────────────────────────────────────────────────
  getCreators: (page = 1, limit = 20) =>
    apiFetch<{ items: AdminCreator[]; total: number }>(
      `/api/v1/admin/users?role=creator&page=${page}&limit=${limit}`
    ),
  verifyCreator: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/users/${id}/verify`, { method: 'POST' }),
  unverifyCreator: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/users/${id}/unverify`, { method: 'POST' }),

  // ─── Reality Shows ──────────────────────────────────────────────────────
  getRealityShows: (page = 1, limit = 20) =>
    apiFetch<{ items: RealityShow[]; total: number }>(
      `/api/v1/admin/reality-shows?page=${page}&limit=${limit}`
    ),
  updateRealityShowStatus: (id: string, status: string) =>
    apiFetch<unknown>(`/api/v1/admin/reality-shows/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  createRealityShow: (data: {
    title: string;
    description?: string;
    creatorId?: string;
    thumbnail?: string;
    status?: string;
    isExclusive?: boolean;
    isPremiere?: boolean;
  }) =>
    apiFetch<unknown>('/api/v1/admin/reality-shows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRealityShow: (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
    }
  ) =>
    apiFetch<unknown>(`/api/v1/admin/reality-shows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRealityShow: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/reality-shows/${id}`, { method: 'DELETE' }),
  getRealityContestants: () =>
    apiFetch<{ contestants: Array<{ id: string; name: string; bio?: string; avatar?: string; status?: string; votes?: number; show?: { id: string; title: string } }> }>('/api/v1/reality/contestants'),

  // ─── Payment Gateways ──────────────────────────────────────────────────
  getPaymentGateways: () =>
    apiFetch<{ items: PaymentGateway[]; recentIntents?: unknown[]; total: number }>(
      '/api/v1/admin/payment-gateways'
    ),
  togglePaymentGateway: (id: string, isEnabled: boolean) =>
    apiFetch<unknown>(`/api/v1/admin/payment-gateways/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: isEnabled }),
    }),
  updateGatewayMode: (id: string, mode: 'live' | 'test') =>
    apiFetch<unknown>(`/api/v1/admin/payment-gateways/${id}/mode`, {
      method: 'PUT',
      body: JSON.stringify({ mode }),
    }),

  // ─── Engagement ─────────────────────────────────────────────────────────
  getWalletStats: () => apiFetch<WalletStats>('/api/v1/admin/wallets/stats'),
  getEngagementMetrics: () => apiFetch<EngagementMetrics>('/api/v1/admin/engagement/metrics'),
  getEngagementTrends: (range: string) =>
    apiFetch<EngagementTrend[]>(`/api/v1/admin/engagement/trends?range=${range}`),

  // ─── Search Analytics ───────────────────────────────────────────────────
  getSearchCorrections: (days = 30) =>
    apiFetch<SearchCorrectionsData>(`/api/v1/analytics/search/corrections?days=${days}`),
  getSearchStats: () => apiFetch<SearchStats>('/api/v1/search/admin/stats'),

  // ─── Notifications ──────────────────────────────────────────────────────
  getNotificationTemplates: () =>
    apiFetch<NotificationTemplate[]>('/api/v1/admin/notification-templates'),
  getNotificationStats: () => apiFetch<NotificationStats>('/api/v1/admin/notifications/stats'),
  createNotificationTemplate: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/notification-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateNotificationTemplate: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/notification-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteNotificationTemplate: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/notification-templates/${id}`, {
      method: 'DELETE',
    }),

  // ─── Reports ────────────────────────────────────────────────────────────
  getReports: (range?: string) =>
    apiFetch<{ reports: SavedAdminReport[]; summary: ReportsActivitySummary }>(
      `/api/v1/admin/reports${range ? `?range=${range}` : ''}`
    ),
  createCustomReport: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
  executeReport: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/reports/${id}/execute`, { method: 'POST' }),
  deleteReport: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/reports/${id}`, { method: 'DELETE' }),

  // ─── Universes ──────────────────────────────────────────────────────────
  // Backend paginates server-side: returns {data: [...], meta: {total, page,
  // limit, totalPages}}. Typed loosely because older callers may still treat
  // the response as a bare array.
  getAllUniverses: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return apiFetch<
      | AdminUniverse[]
      | {
          data: AdminUniverse[];
          meta: { total: number; page: number; limit: number; totalPages: number };
        }
    >(`/api/v1/admin/universes?${params.toString()}`);
  },
  getUniverseById: (id: string) => apiFetch<AdminUniverse>(`/api/v1/admin/universes/${id}`),
  createUniverse: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/universes', { method: 'POST', body: JSON.stringify(data) }),
  updateUniverse: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUniverse: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${id}`, { method: 'DELETE' }),
  toggleUniverse: (id: string, isEnabled: boolean) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ isEnabled }),
    }),
  updateFeatureFlag: (universeId: string, flag: FeatureFlag) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${universeId}/feature-flags`, {
      method: 'PUT',
      body: JSON.stringify(flag),
    }),
  // (deleteFeatureFlag was a dead duplicate of deleteFeatureFlagByKey — removed.)

  // ─── Feature Flags (per-universe, published to Redis at runtime) ──────
  listFeatureFlags: () => apiFetch<unknown>('/api/v1/admin/universes/feature-flags'),
  pruneStaleUniverseFlags: (keys?: Array<{ universeId: string; featureKey: string }>) =>
    apiFetch<{
      removedCount: number;
      removedKeys: string[];
      archivedCount: number;
      skipped: string[];
    }>('/api/v1/admin/universes/feature-flags/prune-stale', {
      method: 'POST',
      body: JSON.stringify(keys && keys.length ? { keys } : {}),
    }),
  restoreUniverseFlags: (keys: Array<{ universeId: string; featureKey: string }>) =>
    apiFetch<{
      restoredCount: number;
      restored: Array<{ key: string; enabled?: boolean }>;
      skipped: Array<{ key: string; reason: string }>;
    }>('/api/v1/admin/universes/feature-flags/restore', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),
  listRecentlyDeletedUniverseFlags: (limit = 20) =>
    apiFetch<
      Array<{
        key: string;
        universeId?: string;
        featureKey?: string;
        universeName?: string;
        deletedAt: string;
        deletedBy?: string | null;
        archived: boolean;
        enabled?: boolean;
      }>
    >(`/api/v1/admin/universes/feature-flags/deleted?limit=${limit}`),
  createFeatureFlag: (universeId: string, flag: FeatureFlag) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${universeId}/feature-flags`, {
      method: 'PUT',
      body: JSON.stringify(flag),
    }),
  toggleFeatureFlag: (universeId: string, flag: FeatureFlag) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${universeId}/feature-flags`, {
      method: 'PUT',
      body: JSON.stringify(flag),
    }),
  deleteFeatureFlagByKey: (universeId: string, featureKey: string) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${universeId}/feature-flags/${featureKey}`, {
      method: 'DELETE',
    }),

  // ─── Global Feature Flags (Redis store, merged with registered defaults) ─
  listGlobalFeatureFlags: () => apiFetch<GlobalFeatureFlag[]>('/api/v1/admin/feature-flags'),
  updateGlobalFeatureFlag: (key: string, data: Partial<GlobalFeatureFlag>) =>
    apiFetch<GlobalFeatureFlag>(`/api/v1/admin/feature-flags/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetGlobalFeatureFlag: (key: string) =>
    apiFetch<{ key: string; removed: boolean }>(`/api/v1/admin/feature-flags/${key}`, {
      method: 'DELETE',
    }),
  listKnownFlags: () =>
    apiFetch<{
      domains: Array<{ domain: string; flags: Array<{ property: string; key: string }> }>;
      total: number;
    }>('/api/v1/admin/feature-flags/known'),
  listStaleFlagMetrics: () =>
    apiFetch<StaleFlagMetrics>('/api/v1/admin/feature-flags/stale/metrics'),
  getLastNightlyRun: () =>
    apiFetch<LastNightlyRun | null>('/api/v1/admin/feature-flags/nightly/last'),
  pruneStaleFlags: (keys?: string[]) =>
    apiFetch<{
      removedCount: number;
      removedKeys: string[];
      archivedCount: number;
      skipped: string[];
    }>('/api/v1/admin/feature-flags/prune-stale', {
      method: 'POST',
      body: JSON.stringify(keys && keys.length ? { keys } : {}),
    }),
  listRecentlyDeletedFlags: (limit = 20) =>
    apiFetch<
      Array<{
        key: string;
        deletedAt: string;
        deletedBy?: string | null;
        archived: boolean;
        enabled?: boolean;
      }>
    >(`/api/v1/admin/feature-flags/deleted?limit=${limit}`),
  restoreFlags: (keys: string[]) =>
    apiFetch<{
      restoredCount: number;
      restored: Array<{ key: string; enabled?: boolean }>;
      skipped: Array<{ key: string; reason: string }>;
    }>('/api/v1/admin/feature-flags/restore', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),

  // ─── CDN (media-service admin purge) ────────────────────────────────────
  purgeCdn: (data: { keys?: string[]; prefix?: string } = { prefix: 'uploads' }) =>
    apiFetch<{ invalidationId?: string; purged: number }>('/api/v1/media/admin/cdn/purge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUniverseStats: () => apiFetch<unknown>('/api/v1/admin/universes/stats'),
  resyncUniverse: (id: string) =>
    apiFetch<{
      name?: string;
      isEnabled?: boolean;
      flagSync?: { ok: boolean; failedKeys: string[] };
    }>(`/api/v1/admin/universes/${id}/resync`, { method: 'POST' }),
  cloneUniverse: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  exportUniverse: (id: string) => apiFetch<unknown>(`/api/v1/admin/universes/export/${id}`),
  importUniverses: (data: unknown) =>
    apiFetch<unknown>('/api/v1/admin/universes/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkToggleUniverses: (ids: string[], isEnabled: boolean) =>
    apiFetch<unknown>('/api/v1/admin/universes/bulk/toggle', {
      method: 'POST',
      body: JSON.stringify({ ids, isEnabled }),
    }),

  // ─── Agbala / Storyworlds ───────────────────────────────────────────────
  getStoryworlds: (page = 1, limit = 20) =>
    apiFetch<{ items: Storyworld[]; total: number }>(
      `/api/v1/admin/agbala/storyworlds?page=${page}&limit=${limit}`
    ),
  getStoryworldById: (id: string) => apiFetch<Storyworld>(`/api/v1/admin/agbala/storyworlds/${id}`),
  createStoryworld: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/agbala/storyworlds', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStoryworld: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteStoryworld: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${id}`, { method: 'DELETE' }),
  // Publish state is a field on the storyworld, not a dedicated endpoint —
  // the backend exposes PATCH /admin/agbala/storyworlds/:id with isPublished.
  publishStoryworld: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished: true }),
    }),
  unpublishStoryworld: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished: false }),
    }),

  // ─── Agbala / Characters ────────────────────────────────────────────────
  // Characters live under the nested storyworld route upstream — the flat
  // /admin/agbala/characters path has no backend route (404).
  getCharacters: (
    storyworldId: string,
    params: { page?: number; limit?: number; search?: string } = {}
  ) => {
    const qs = new URLSearchParams();
    if (params.page != null) qs.set('page', String(params.page));
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    const query = qs.toString();
    return apiFetch<{
      items: AgbalaCharacter[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/v1/admin/agbala/storyworlds/${storyworldId}/characters${query ? `?${query}` : ''}`);
  },
  createCharacter: (storyworldId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${storyworldId}/characters`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCharacter: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/characters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCharacter: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/characters/${id}`, { method: 'DELETE' }),

  // ─── Agbala / Paths ──────────────────────────────────────────────────────
  getPaths: (
    storyworldId: string,
    params: { page?: number; limit?: number; search?: string } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    const qs = q.toString();
    return apiFetch<unknown>(
      `/api/v1/admin/agbala/storyworlds/${storyworldId}/paths${qs ? `?${qs}` : ''}`
    );
  },
  createPath: (storyworldId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${storyworldId}/paths`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePath: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/paths/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePath: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/paths/${id}`, { method: 'DELETE' }),

  // ─── Agbala / Quizzes ────────────────────────────────────────────────────
  getQuizzes: (storyworldId?: string, page = 1, limit = 20) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (storyworldId) q.set('storyworldId', storyworldId);
    return apiFetch<{ items: AgbalaQuiz[]; total: number }>(`/api/v1/admin/agbala/quizzes?${q}`);
  },
  createQuiz: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/agbala/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteQuiz: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/quizzes/${id}`, { method: 'DELETE' }),

  // ─── Agbala / Theory moderation ─────────────────────────────────────────
  // Proxied to vertical-service's agbala moderation surface; items are
  // pending theory submissions ({ id, type, title, content, authorName,
  // submittedAt, status }).
  getReviewQueue: (page = 1, limit = 20) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/moderation/review-queue?page=${page}&limit=${limit}`),
  approveAgbalaContent: (contentId: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/moderation/${contentId}/approve`, {
      method: 'POST',
    }),
  rejectAgbalaContent: (contentId: string, reason: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/moderation/${contentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // ─── System Settings ────────────────────────────────────────────────────
  getAllSettings: () => apiFetch<SystemSetting[]>('/api/v1/admin/settings'),
  updateSetting: (key: string, value: unknown) =>
    apiFetch<unknown>(`/api/v1/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  bulkUpdateSettings: (entries: Array<{ key: string; value: unknown }>) =>
    apiFetch<unknown>('/api/v1/admin/settings/bulk', {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    }),
  exportSettings: () => apiFetch<unknown>('/api/v1/admin/settings/export'),
  importSettings: (data: unknown, strategy: string) =>
    apiFetch<unknown>('/api/v1/admin/settings/import', {
      method: 'POST',
      body: JSON.stringify({ data, strategy }),
    }),

  // ─── Subscriptions ───────────────────────────────────────────────────────
  getSubscriptionPlans: (
    params: { page?: number; limit?: number; status?: string; tier?: string } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.tier) q.set('tier', params.tier);
    return apiFetch<{ items: SubscriptionPlan[]; total: number }>(
      `/api/v1/admin/subscriptions?${q}`
    );
  },
  getSubscriptionPlanById: (id: string) =>
    apiFetch<SubscriptionPlan>(`/api/v1/admin/subscriptions/${id}`),
  createSubscriptionPlan: (data: Record<string, unknown>) =>
    apiFetch<SubscriptionPlan>('/api/v1/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubscriptionPlan: (id: string, data: Record<string, unknown>) =>
    apiFetch<SubscriptionPlan>(`/api/v1/admin/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSubscriptionPlan: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/subscriptions/${id}`, { method: 'DELETE' }),
  getSubscriptionStats: () => apiFetch<SubscriptionStats>('/api/v1/admin/subscriptions/stats'),
  toggleSubscriptionPlanStatus: (id: string, status: string) =>
    apiFetch<unknown>(`/api/v1/admin/subscriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // ─── Bundle Passes ────────────────────────────────────────────────────────
  getBundlePasses: () => apiFetch<BundlePassAdmin[]>('/api/v1/subscription/bundles'),
  getBundlePass: (id: string) => apiFetch<BundlePassAdmin>(`/api/v1/subscription/bundles/${id}`),
  createBundlePass: (data: Record<string, unknown>) =>
    apiFetch<BundlePassAdmin>('/api/v1/subscription/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBundlePass: (id: string, data: Record<string, unknown>) =>
    apiFetch<BundlePassAdmin>(`/api/v1/subscription/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBundlePass: (id: string) =>
    apiFetch<unknown>(`/api/v1/subscription/bundles/${id}`, { method: 'DELETE' }),

  // ─── Borrow: approved lending partners ────────────────────────────────────
  // Wallet-service admin surface; the public /borrow/banks read is a separate
  // unauthenticated route, so this list includes inactive rows too.
  getPartnerBanks: (limit = 100) =>
    apiFetch<PartnerBankAdmin[]>(`/api/v1/borrow/admin/banks?page=1&limit=${limit}`),
  createPartnerBank: (data: Record<string, unknown>) =>
    apiFetch<PartnerBankAdmin>('/api/v1/borrow/admin/banks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePartnerBank: (id: string, data: Record<string, unknown>) =>
    apiFetch<PartnerBankAdmin>(`/api/v1/borrow/admin/banks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePartnerBank: (id: string) =>
    apiFetch<unknown>(`/api/v1/borrow/admin/banks/${id}`, { method: 'DELETE' }),

  // ─── Live Events (PPV) ────────────────────────────────────────────────────
  listLiveEvents: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return apiFetch<{ items: LiveEventAdmin[]; total: number }>(`/api/v1/admin/live-events${q}`);
  },
  getLiveEvent: (id: string) => apiFetch<LiveEventAdmin>(`/api/v1/admin/live-events/${id}`),
  createLiveEvent: (data: Partial<LiveEventAdmin>) =>
    apiFetch<LiveEventAdmin>('/api/v1/admin/live-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLiveEvent: (id: string, data: Partial<LiveEventAdmin>) =>
    apiFetch<LiveEventAdmin>(`/api/v1/admin/live-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancelLiveEvent: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/live-events/${id}/cancel`, { method: 'DELETE' }),

  // ─── Tipping ─────────────────────────────────────────────────────────────
  getTipStats: (creatorId: string) =>
    apiFetch<{ totalTips: number; totalAmount: number; topTier: string | null }>(
      `/api/v1/creators/tips/stats/${creatorId}`
    ),
  getTipLeaderboard: (creatorId: string, period = 'all') =>
    apiFetch<{
      entries: Array<{ userId: string; totalAmount: number; tier: string }>;
      period: string;
    }>(`/api/v1/creators/tips/leaderboard/${creatorId}?period=${period}`),

  // ─── Moderation ──────────────────────────────────────────────────────────
  getModerationReports: (
    params: { page?: number; limit?: number; status?: string; type?: string } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.type) q.set('type', params.type);
    return apiFetch<{
      reports: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/v1/admin/moderation/reports?${q.toString()}`);
  },
  getModerationStats: () =>
    apiFetch<{
      pendingReports: number;
      inReviewReports: number;
      resolvedReports: number;
      totalReports: number;
    }>('/api/v1/admin/moderation/reports/stats'),
  resolveModerationReport: (id: string, action: string, reason: string) =>
    apiFetch<unknown>(`/api/v1/admin/moderation/reports/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason }),
    }),
  takeSafetyAction: (body: {
    targetId: string;
    targetType: string;
    actionType: string;
    reason: string;
    duration?: string;
  }) =>
    apiFetch<unknown>('/api/v1/admin/moderation/safety-action', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getSafetyActions: (limit = 20) =>
    apiFetch<{ items?: unknown[] } | unknown[]>(
      `/api/v1/admin/moderation/safety-actions?limit=${limit}`
    ),
  dismissModerationReport: (id: string, reason: string) =>
    apiFetch<unknown>(`/api/v1/admin/moderation/reports/${id}/dismiss`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  // ─── Audit Logs ─────────────────────────────────────────────────────────
  getAuditLogs: (
    params: {
      page?: number;
      limit?: number;
      category?: string;
      action?: string;
      targetType?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.category) q.set('category', params.category);
    if (params.action) q.set('action', params.action);
    if (params.targetType) q.set('targetType', params.targetType);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    return apiFetch<{
      logs: AuditLogEntry[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/v1/admin/audit?${q}`);
  },

  getOpsStatus: () => apiFetch<OpsStatus>('/api/v1/admin/ops/status'),
  getOpsServices: () => apiFetch<OpsServicesSnapshot>('/api/v1/admin/ops/services'),
  getOpsRunHistory: (hours?: number) =>
    apiFetch<OpsRunHistory>(`/api/v1/admin/ops/runs${hours ? `?hours=${hours}` : ''}`),
  getOpsPgbouncer: () => apiFetch<PgbouncerHealth>('/api/v1/admin/ops/pgbouncer'),
  getOpsForeignPersistence: (hours?: number) =>
    apiFetch<ForeignPersistence>(
      `/api/v1/admin/ops/pgbouncer/foreign-persistence${hours ? `?hours=${hours}` : ''}`
    ),
  getOpsTransportFlipTrend: (days?: number) =>
    apiFetch<TransportFlipTrend>(`/api/v1/admin/ops/transport-flips${days ? `?days=${days}` : ''}`),
  getGatewayHttp: () => apiFetch<GatewayHttpSummary>('/api/v1/admin/ops/gateway-http'),
  getGatewayRateLimits: () =>
    apiFetch<GatewayRateLimitSnapshot>('/api/v1/admin/ops/gateway-rate-limits'),
  runOpsJob: (job: string) =>
    apiFetch<RunJobOutcome>(`/api/v1/admin/ops/run/${job}`, { method: 'POST' }),

  // ─── Payout Requests (G7 — Financial) ────────────────────────────────────────
  getPayoutRequests: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    return apiFetch<{ items: PayoutRequest[]; total: number; stats: PayoutStats }>(
      `/api/v1/admin/wallets/payouts?${q}`
    );
  },
  approvePayoutRequest: (id: string) =>
    apiFetch<PayoutRequest>(`/api/v1/admin/wallets/payouts/${id}/approve`, { method: 'PUT' }),
  rejectPayoutRequest: (id: string, reason: string) =>
    apiFetch<PayoutRequest>(`/api/v1/admin/wallets/payouts/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  // ─── Bulk user actions (G1 — Users) ──────────────────────────────────────────
  bulkSuspendUsers: (ids: string[], reason: string, durationDays?: number) =>
    apiFetch<{ suspended: number; failed: number }>('/api/v1/admin/users/bulk/suspend', {
      method: 'POST',
      body: JSON.stringify({ ids, reason, durationDays }),
    }),

  // ─── Tipping Config (G2 — Tipping) ───────────────────────────────────────────
  getTippingConfig: () => apiFetch<TippingConfig>('/api/v1/admin/ops/tipping-config'),
  updateTippingConfig: (cfg: Partial<TippingConfig>) =>
    apiFetch<TippingConfig>('/api/v1/admin/ops/tipping-config', {
      method: 'PUT',
      body: JSON.stringify(cfg),
    }),

  // ─── Promo Codes (G3 — Subscriptions) ────────────────────────────────────────
  getPromoCodes: () =>
    apiFetch<{ items: PromoCode[]; total: number }>('/api/v1/admin/subscriptions/promo-codes'),
  createPromoCode: (data: Omit<PromoCode, 'id' | 'usedCount' | 'status' | 'createdAt'>) =>
    apiFetch<PromoCode>('/api/v1/admin/subscriptions/promo-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  expirePromoCode: (id: string) =>
    apiFetch<PromoCode>(`/api/v1/admin/subscriptions/promo-codes/${id}/expire`, {
      method: 'PUT',
    }),
  deletePromoCode: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/subscriptions/promo-codes/${id}`, { method: 'DELETE' }),

  // ─── Webhook Events (G4 — Payment Gateways) ──────────────────────────────────
  getGatewayWebhooks: (id: string, limit = 20) =>
    apiFetch<{ items: WebhookEvent[]; total: number }>(
      `/api/v1/admin/payment-gateways/${id}/webhooks?limit=${limit}`
    ),

  // ─── Settings test-integration (G5 — Settings) ───────────────────────────────
  testSettingIntegration: (provider: string) =>
    apiFetch<{
      provider: string;
      status: string;
      testedAt: string;
      details: Record<string, unknown>;
    }>(`/api/v1/admin/settings/integrations/${provider}/test`, { method: 'POST' }),

  // ─── Settings access + security surfaces (roles, admins, IP rules) ──────────
  getAccessRoles: () => apiFetch<unknown>('/api/v1/admin/settings/access/roles'),
  updateAccessRole: (
    role: string,
    data: {
      role: string;
      permissions: Record<string, string[]>;
      description?: string;
      isActive?: boolean;
    }
  ) =>
    apiFetch<unknown>(`/api/v1/admin/settings/access/roles/${encodeURIComponent(role)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getAccessAdmins: () => apiFetch<unknown>('/api/v1/admin/settings/access/admins'),
  createAccessAdmin: (data: {
    email: string;
    displayName: string;
    role: string;
    password?: string;
    sendInvite?: boolean;
  }) =>
    apiFetch<unknown>('/api/v1/admin/settings/access/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeAccessAdmin: (email: string) =>
    apiFetch<unknown>(`/api/v1/admin/settings/access/admins/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),
  getIpRules: () => apiFetch<unknown>('/api/v1/admin/settings/security/ip-rules'),
  updateIpRules: (data: {
    whitelist?: string[];
    blacklist?: string[];
    mode?: string;
    rateLimitPerIp?: number;
  }) =>
    apiFetch<unknown>('/api/v1/admin/settings/security/ip-rules', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // ─── Support Tickets (G6 — Support) ──────────────────────────────────────────
  getSupportStats: () => apiFetch<SupportStats>('/api/v1/admin/support/stats'),
  getSupportTickets: (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      category?: string;
      search?: string;
    } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.priority) q.set('priority', params.priority);
    if (params.category) q.set('category', params.category);
    if (params.search) q.set('search', params.search);
    return apiFetch<{ items: SupportTicket[]; total: number; totalPages: number }>(
      `/api/v1/admin/support/tickets?${q}`
    );
  },
  getSupportTicket: (id: string) => apiFetch<SupportTicket>(`/api/v1/admin/support/tickets/${id}`),
  updateSupportTicketStatus: (id: string, status: string) =>
    apiFetch<SupportTicket>(`/api/v1/admin/support/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  assignSupportTicket: (id: string, assignedTo: string) =>
    apiFetch<SupportTicket>(`/api/v1/admin/support/tickets/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ assignedTo }),
    }),
  replySupportTicket: (id: string, body: string) =>
    apiFetch<SupportTicket>(`/api/v1/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  // ── Lifestyle guides (9TLIFE catalogs) — served by lifestyle-service ──

  getItineraries: (status?: string) =>
    apiFetch<Itinerary[]>(
      `/api/v1/lifestyle/admin/itineraries${status && status !== 'all' ? `?status=${status}` : ''}`
    ),
  createItinerary: (data: {
    title: string;
    description: string;
    city: string;
    duration: string;
    status?: string;
    stops: Array<{ name: string; description: string; duration: string; order: number }>;
  }) =>
    apiFetch<Itinerary>('/api/v1/lifestyle/admin/itineraries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItinerary: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      city: string;
      duration: string;
      rating: number;
      status: string;
      stops: Array<{ name: string; description: string; duration: string; order: number }>;
    }>
  ) =>
    apiFetch<Itinerary>(`/api/v1/lifestyle/admin/itineraries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteItinerary: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/lifestyle/admin/itineraries/${id}`, {
      method: 'DELETE',
    }),

  getNeighborhoods: (status?: string) =>
    apiFetch<Neighborhood[]>(
      `/api/v1/lifestyle/admin/neighborhoods${status && status !== 'all' ? `?status=${status}` : ''}`
    ),
  createNeighborhood: (data: {
    name: string;
    city: string;
    description: string;
    image?: string;
    status?: string;
    places?: Array<{ name: string; category: string; rating: number; address?: string }>;
  }) =>
    apiFetch<Neighborhood>('/api/v1/lifestyle/admin/neighborhoods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateNeighborhood: (
    id: string,
    data: Partial<{
      name: string;
      city: string;
      description: string;
      image: string;
      status: string;
      places: Array<{ name: string; category: string; rating: number; address?: string }>;
    }>
  ) =>
    apiFetch<Neighborhood>(`/api/v1/lifestyle/admin/neighborhoods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteNeighborhood: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/lifestyle/admin/neighborhoods/${id}`, {
      method: 'DELETE',
    }),

  getPartners: (status?: string) =>
    apiFetch<Partner[]>(
      `/api/v1/lifestyle/admin/partners${status && status !== 'all' ? `?status=${status}` : ''}`
    ),
  createPartner: (data: {
    name: string;
    category: string;
    city: string;
    description: string;
    rating?: number;
    address?: string;
    phone?: string;
    status?: string;
  }) =>
    apiFetch<Partner>('/api/v1/lifestyle/admin/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePartner: (
    id: string,
    data: Partial<{
      name: string;
      category: string;
      city: string;
      description: string;
      rating: number;
      address: string;
      phone: string;
      status: string;
    }>
  ) =>
    apiFetch<Partner>(`/api/v1/lifestyle/admin/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePartner: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/lifestyle/admin/partners/${id}`, {
      method: 'DELETE',
    }),

  getOffers: (status?: string) =>
    apiFetch<PartnerOffer[]>(
      `/api/v1/lifestyle/admin/offers${status && status !== 'all' ? `?status=${status}` : ''}`
    ),
  createOffer: (
    partnerId: string,
    data: {
      title: string;
      description: string;
      discount: string;
      category: string;
      terms: string[];
      validUntil: string;
      status?: string;
    }
  ) =>
    apiFetch<PartnerOffer>(`/api/v1/lifestyle/admin/partners/${partnerId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOffer: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      discount: string;
      category: string;
      terms: string[];
      validUntil: string;
      status: string;
    }>
  ) =>
    apiFetch<PartnerOffer>(`/api/v1/lifestyle/admin/offers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteOffer: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/v1/lifestyle/admin/offers/${id}`, {
      method: 'DELETE',
    }),

  // Navigation Menus (Superadmin Menu Management)
  listMenus: () => apiFetch<NavigationMenu[]>('/api/v1/admin/menus'),
  getMenu: (id: string) =>
    apiFetch<NavigationMenu>(`/api/v1/admin/menus/${encodeURIComponent(id)}`),
  createMenu: (data: {
    name: string;
    location: string;
    description?: string;
    isActive?: boolean;
    items?: MenuItem[];
  }) =>
    apiFetch<NavigationMenu>('/api/v1/admin/menus', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMenu: (
    id: string,
    data: {
      name?: string;
      location?: string;
      description?: string;
      isActive?: boolean;
      items: MenuItem[];
    }
  ) =>
    apiFetch<NavigationMenu>(`/api/v1/admin/menus/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMenu: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(
      `/api/v1/admin/menus/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    ),
  getPublicMenu: (location: string) =>
    apiFetch<NavigationMenu>(`/api/v1/admin/menus/public/${encodeURIComponent(location)}`),
};

/** Outcome of a manual "Run now" job execution. */
export interface RunJobOutcome {
  job: string;
  ok: boolean;
  durationMs: number;
  output: string[];
}

/** One probe/card on the Ops Health page. */
export interface OpsCheck {
  ok: boolean;
  label: string;
  detail: string;
  latencyMs?: number;
  ageMinutes?: number;
  lastRunAt?: string;
  /** Rows the job purged in its last pass (retention jobs only). */
  rowsPurged?: number;
}

export interface OpsAlert {
  at: string;
  level: 'WARN' | 'ERROR';
  source: string;
  message: string;
}

/** Loopback transport that answered a health probe (mirrors backend). */
export type LoopbackTransport = 'localhost' | 'ipv6' | 'ipv4';

/** One service's fleet health probe result (mirrors backend shape). */
export interface OpsServiceHealth {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  dbStatus: 'up' | 'down' | 'unknown';
  /** Which transport answered — 'ipv6' means a ::1-only listener (healthy). */
  transport?: LoopbackTransport;
  /** 'down' only: last transport failure code (e.g. ECONNREFUSED). */
  errorDetail?: string;
}

/** A service's answering transport CHANGED between two probe sweeps —
 * usually someone re-bound the service. familyChanged crosses ::1/127.0.0.1. */
export interface OpsTransportFlip {
  service: string;
  port: number;
  from: LoopbackTransport;
  to: LoopbackTransport;
  detectedAt: number;
  familyChanged: boolean;
}

/** GET /admin/ops/services — fleet probe sweep + recent transport flips. */
export interface OpsServicesSnapshot {
  services: OpsServiceHealth[];
  transportFlips: OpsTransportFlip[];
  /** Backing of the transport store right now — drives the header chip. */
  transportStore: TransportStoreStatus | null;
  checkedAt: string;
}

/** Backing of the ops transport store (baselines + flip hold window). */
export type TransportStoreMode = 'redis' | 'memory';

/** GET /admin/ops/services → transportStore — Redis-backed vs degraded memory. */
export interface TransportStoreStatus {
  mode: TransportStoreMode;
  detail: string;
  /** Redis DB index the store writes to, or null when it couldn't be resolved. */
  redisDb: number | null;
}

/** GET /admin/ops/transport-flips — ledger-backed flip persistence trend. */
export interface TransportFlipTrendRow {
  service: string;
  transport: string;
  day: string;
  sweeps: number;
  flips: number;
  familyFlips: number;
  lastFlipAt: string | null;
  lastFrom: string | null;
  lastTo: string | null;
}

export interface TransportFlipTrend {
  windowDays: number;
  rows: TransportFlipTrendRow[];
  /** Individual detected transitions (ledger events), newest first. */
  events: TransportFlipEventRow[];
  servicesWithFlips: number;
  totalFlips: number;
  totalFamilyFlips: number;
  detail?: string;
}

/** One persisted transport transition (job_runs job `transport-flip-event`). */
export interface TransportFlipEventRow {
  service: string;
  port: number;
  from: string;
  to: string;
  familyChanged: boolean;
  /** ISO of the probe sweep that observed the new transport. */
  detectedAt: string;
}

export interface OpsStatus {
  overall: 'healthy' | 'degraded' | 'down';
  db: OpsCheck;
  federation: OpsCheck;
  jobs: OpsCheck[];
  alerts: OpsAlert[];
  checkedAt: string;
}

/** One database's client/server pool snapshot from pgbouncer SHOW POOLS. */
export interface PgbouncerPoolRow {
  database: string;
  user: string;
  clActive: number;
  clWaiting: number;
  svActive: number;
  svIdle: number;
}

/** Result of the pgbouncer saturation probe (GET /admin/ops/pgbouncer). */
/** One prisma workspace's client-side pool cap (mirrors backend shape). */
export interface PgbouncerServiceBudget {
  workspace: string;
  database: string | null;
  connectionLimit: number | null;
}

/** Per-database rollup of service budgets (mirrors backend shape). */
export interface PgbouncerDatabaseBudget {
  database: string;
  services: PgbouncerServiceBudget[];
  worstCaseTotal: number;
  uncapped: string[];
}

/** One repo-owned process holding a direct (non-pgbouncer) Postgres socket. */
export interface PgbouncerBypass {
  workspace: string;
  command: string;
  pid: number;
  connections: number;
}

/** GET /admin/ops/pgbouncer/foreign-persistence — per-workspace foreign-dialer
 * persistence over a caller-chosen window (the card's 48h/7d/14d toggle).
 * Same row shape the pgbouncer snapshot embeds; the window is explicit here. */
export interface ForeignPersistence {
  windowHours: number;
  /** Sustained threshold applied (mirrors POOL_FOREIGN_MIN_SPAN_H default). */
  sustainedMinSpanHours: number;
  rows: Array<{
    workspace: string;
    passes: number;
    spanHours: number;
    lastSeen: string;
    conns: number | null;
    sustained: boolean;
    approved: boolean;
    /** Owning project via POOL_FOREIGN_PROJECT_ROOTS prefix match (longest
     * root wins), or the workspace itself when nothing matched — the card
     * groups on this. Optional: absent on a pre-attribution backend. */
    project?: string;
    /** Flagged passes per bucket over windowHours, oldest → newest —
     * the row's frequency sparkline. Fixed 24 buckets regardless of window. */
    history: number[];
    /** Peak connection count per history bucket, oldest → newest (null when
     * that bucket had no pass recording a count) — the row's intensity
     * sparkline: dial hardness alongside dial frequency. Optional so the
     * client degrades gracefully against a pre-intensity backend during
     * rolling deploys. */
    connHistory?: Array<number | null>;
    /** Seconds per history bucket (windowHours / 24). */
    bucketSeconds: number;
  }>;
  /** Pool-health tracking issue URL when resolvable — sustained rows link
   * to it; null/unset degrades the card to plain badges. */
  trackingIssueUrl?: string | null;
  /** Present when the ledger read failed: why the rows are empty. */
  detail?: string;
}

export interface PgbouncerHealth {
  available: boolean;
  detail?: string;
  maxClientConn?: number;
  totalClients?: number;
  usagePercent?: number;
  level?: 'ok' | 'degraded' | 'critical';
  pools?: PgbouncerPoolRow[];
  /** Per-database client-side pool budgets from workspace .env files. */
  serviceBudgets?: PgbouncerDatabaseBudget[];
  /** Present when serviceBudgets is empty: why discovery produced nothing. */
  budgetsDetail?: string;
  /** Repo-owned direct-to-Postgres clients — violations of the pooler rule. */
  bypasses?: PgbouncerBypass[];
  /** Foreign (non-repo) direct clients — another project's noise. */
  /** Foreign (non-repo) direct clients — context, never counted as bypasses.
   * `ipv6` (when present) counts that workspace's dials over IPv6 loopback (::1).
   */
  foreignDirectClients?: Array<{ workspace: string; connections: number; ipv6?: number }>;
  /** Ledger-derived per-workspace persistence spans over the window — how
   * LONG each foreign dialer has been dialing, not just who dials right now.
   * `sustained` marks rows at/over the tracking-issue threshold (24h+);
   * `approved` marks rows on POOL_FOREIGN_ALLOWLIST — visible (the budget
   * impact is real) but never sustained, so never tracked. */
  foreignPersistence?: ForeignPersistence;
  /** Present when the bypass scan itself failed (e.g. lsof unavailable). */
  bypassesDetail?: string;
  checkedAt: string;
  latencyMs: number;
}

/** One appended pass from the job_runs ledger. */
export interface JobRunRow {
  job: string;
  status: 'ok' | 'warn' | 'error';
  detail: string | null;
  rowsPurged: number | null;
  durationMs: number | null;
  ranAt: string;
}

/** One UTC day of pass history for a single job (only days with runs appear). */
export interface JobRunDailySummary {
  date: string;
  total: number;
  ok: number;
  /** Whole-percent success rate: round(100 * ok / total). */
  rate: number;
}

/** A report definition saved from the Report Builder. */
export interface SavedAdminReport {
  id: string;
  name: string;
  category: string;
  dateRange: string;
  format: string;
  config: unknown;
  createdAt: string;
  createdBy?: string;
  lastRunAt?: string | null;
  lastRunSummary?: string | null;
}

/** The activity summary behind the Reports page's overview strip. */
export interface ReportsActivitySummary {
  userGrowth: Record<string, number>;
  contentPublished: Record<string, number>;
  revenue: Record<string, number>;
  reports: { total: number; pending: number; resolved: number; byType: Record<string, number> };
}

/** One endpoint's latency profile from the gateway's Prometheus histogram. */
export interface GatewayRouteMetric {
  route: string;
  method: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
}

export interface GatewayHttpSummary {
  available: boolean;
  scrapedAt: string;
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
  routes: GatewayRouteMetric[];
}

export interface GatewayRateLimitEntry {
  identifierType: 'ip' | 'account';
  identifier: string;
  endpoint: string;
  limit: number;
  remaining: number;
  usagePercent: number;
}

export interface GatewayRateLimitSnapshot {
  available: boolean;
  scrapedAt: string;
  entries: GatewayRateLimitEntry[];
  blockedTotal: number;
  blockedByEndpoint: Array<{ endpoint: string; blocked: number }>;
  strictMode: boolean;
}

export interface JobRunSummary {
  job: string;
  /** Counts cover the FULL requested window, not the capped `runs` array. */
  total: number;
  ok: number;
  warn: number;
  error: number;
  lastAt: string | null;
  runs: JobRunRow[];
  /** Chronological per-day success rates across the full window. */
  daily: JobRunDailySummary[];
}

export interface OpsRunHistory {
  windowHours: number;
  perJob: JobRunSummary[];
}

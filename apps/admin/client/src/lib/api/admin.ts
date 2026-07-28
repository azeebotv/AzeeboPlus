import { apiFetch } from './base';
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
  AdminUniverse,
  Storyworld,
  AgbalaCharacter,
  AgbalaPath,
  AgbalaQuiz,
  FeatureFlag,
  SystemSetting,
  SubscriptionPlan,
  SubscriptionStats,
  LiveEventAdmin,
  BundlePassAdmin,
} from '../admin-types';

export interface DashboardStats {
  totalUsers: number;
  dailyActiveUsers: number;
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
  getPlatformOverview: () => apiFetch<PlatformOverview>('/api/v1/admin/overview'),

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
    apiFetch<unknown>(`/api/v1/admin/creators/${id}/verify`, { method: 'POST' }),
  unverifyCreator: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/creators/${id}/unverify`, { method: 'POST' }),

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

  // ─── Payment Gateways ──────────────────────────────────────────────────
  getPaymentGateways: () => apiFetch<PaymentGateway[]>('/api/v1/admin/payment-gateways'),
  togglePaymentGateway: (id: string, isEnabled: boolean) =>
    apiFetch<unknown>(`/api/v1/admin/payment-gateways/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ isEnabled }),
    }),

  // ─── Engagement ─────────────────────────────────────────────────────────
  getEngagementMetrics: () => apiFetch<EngagementMetrics>('/api/v1/admin/engagement/metrics'),
  getEngagementTrends: (range: string) =>
    apiFetch<EngagementTrend[]>(`/api/v1/admin/engagement/trends?range=${range}`),

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
    apiFetch<AdminReport[]>(`/api/v1/admin/reports${range ? `?range=${range}` : ''}`),
  createCustomReport: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
  executeReport: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/reports/${id}/execute`, { method: 'POST' }),
  deleteReport: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/reports/${id}`, { method: 'DELETE' }),

  // ─── Universes ──────────────────────────────────────────────────────────
  getAllUniverses: () => apiFetch<AdminUniverse[]>('/api/v1/admin/universes'),
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
  deleteFeatureFlag: (universeId: string, featureKey: string) =>
    apiFetch<unknown>(`/api/v1/admin/universes/${universeId}/feature-flags/${featureKey}`, {
      method: 'DELETE',
    }),

  // ─── Platform Feature Flags ────────────────────────────────────────────
  listFeatureFlags: () => apiFetch<unknown>('/api/v1/admin/feature-flags'),
  createFeatureFlag: (data: { key: string; description?: string; rolloutPercentage?: number }) =>
    apiFetch<unknown>('/api/v1/admin/feature-flags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleFeatureFlag: (key: string) =>
    apiFetch<unknown>(`/api/v1/admin/feature-flags/${key}/toggle`, { method: 'POST' }),
  deleteFeatureFlagByKey: (key: string) =>
    apiFetch<unknown>(`/api/v1/admin/feature-flags/${key}`, { method: 'DELETE' }),

  getUniverseStats: () => apiFetch<unknown>('/api/v1/admin/universes/stats'),
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
  publishStoryworld: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${id}/publish`, { method: 'POST' }),
  unpublishStoryworld: (id: string) =>
    apiFetch<unknown>(`/api/v1/admin/agbala/storyworlds/${id}/unpublish`, { method: 'POST' }),

  // ─── Agbala / Characters ────────────────────────────────────────────────
  getCharacters: (storyworldId?: string, page = 1, limit = 20) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (storyworldId) q.set('storyworldId', storyworldId);
    return apiFetch<{ items: AgbalaCharacter[]; total: number }>(
      `/api/v1/admin/agbala/characters?${q}`
    );
  },
  createCharacter: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/agbala/characters', {
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
  getPaths: (page = 1, limit = 20) =>
    apiFetch<{ items: AgbalaPath[]; total: number }>(
      `/api/v1/admin/agbala/paths?page=${page}&limit=${limit}`
    ),
  createPath: (data: Record<string, unknown>) =>
    apiFetch<unknown>('/api/v1/admin/agbala/paths', { method: 'POST', body: JSON.stringify(data) }),
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

  // ─── Audit Logs ─────────────────────────────────────────────────────────
  getAuditLogs: (
    params: {
      page?: number;
      limit?: number;
      category?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.category) q.set('category', params.category);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    return apiFetch<{ items: AuditLogEntry[]; total: number }>(`/api/v1/admin/audit?${q}`);
  },
};

import { apiFetch, type ApiError } from './base';
import type {
  DashboardStats,
  ContentList,
  AnalyticsData,
  EarningsData,
  EarningsSummaryData,
  EarningsHistoryData,
  PayoutRequest,
  PayoutSettings,
  PayoutsData,
  ContentItem,
  CreatorSettings,
  SubscribersData,
  UploadProgress,
  MonetizationData,
  MonetizationTier,
  Challenge,
  ChallengeSubmission,
  CreatorProfile,
} from '../creator-types';

const API = '/api/v1';

/**
 * Mutations return `{ success: false, message }` with HTTP 200 on business
 * failures (e.g. "Pending payout already exists"). Throw so react-query
 * marks the mutation failed and the UI shows the real error.
 */
export class RequestFailedError extends Error {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'RequestFailedError';
    this.statusCode = statusCode;
  }
}

export function assertSuccess<T>(res: { success: boolean; message?: string } & { data?: T }): T {
  if (!res.success) {
    throw new RequestFailedError(res.message || 'Request failed');
  }
  return res.data as T;
}

function errorMessage(err: unknown): string {
  if (err instanceof RequestFailedError) return err.message;
  const apiErr = err as ApiError;
  return apiErr?.message || 'Something went wrong. Please try again.';
}

export const creatorApi = {
  RequestFailedError,
  errorMessage,
  assertSuccess,

  getDashboard: () => apiFetch<DashboardStats>(`${API}/creator/dashboard`),

  getContent: (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return apiFetch<ContentList>(`${API}/creator/content?${params}`);
  },

  createContent: (data: { title: string; description?: string; type?: string }) =>
    apiFetch<ContentItem>(`${API}/creator/content`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContent: (id: string, data: Partial<ContentItem>) =>
    apiFetch<ContentItem>(`${API}/creator/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteContent: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`${API}/creator/content/${id}`, {
      method: 'DELETE',
    }),

  publishContent: (id: string) =>
    apiFetch<ContentItem>(`${API}/creator/content/${id}/publish`, {
      method: 'POST',
    }),

  getAnalytics: (period = '30days') =>
    apiFetch<AnalyticsData>(`${API}/creator/analytics?period=${period}`),

  getEarnings: (period = 'this-month') =>
    apiFetch<EarningsData>(`${API}/creator/earnings?period=${period}`),

  getEarningsSummary: () => apiFetch<EarningsSummaryData>(`${API}/creator/earnings/summary`),

  getEarningsHistory: (limit = 50) =>
    apiFetch<EarningsHistoryData>(`${API}/creator/earnings/history?limit=${limit}`),

  requestPayout: () =>
    apiFetch<PayoutRequest>(`${API}/creator/payouts/request`, {
      method: 'POST',
    }),

  updatePayoutSettings: (data: PayoutSettings) =>
    apiFetch<{ success: boolean }>(`${API}/creator/payouts/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSettings: () => apiFetch<CreatorSettings>(`${API}/creator/settings`),

  updateSettings: (data: CreatorSettings) =>
    apiFetch<{ success: boolean }>(`${API}/creator/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Payouts
  getPayouts: () => apiFetch<PayoutsData>(`${API}/creator/payouts`),

  requestPayoutAmount: (amount: number, method: string) =>
    apiFetch<PayoutRequest>(`${API}/creator/payouts/request`, {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    }),

  // Subscribers
  getSubscribers: () => apiFetch<SubscribersData>(`${API}/creator/subscribers`),

  // Studio UI flags (gates v2 surfaces: new analytics, upload v2, payouts UI, onboarding)
  getStudioFlags: () =>
    apiFetch<Array<{ key: string; enabled: boolean; value?: unknown }>>(`${API}/creator/flags`),

  // Uploads — tracked as content items in the local DB
  getUploads: () => apiFetch<UploadProgress[]>(`${API}/creator/uploads`),

  uploadContent: (data: FormData) =>
    apiFetch<UploadProgress>(`${API}/creator/uploads`, {
      method: 'POST',
      body: data,
      headers: {},
    }),

  // Monetization
  getMonetization: () => apiFetch<MonetizationData>(`${API}/creator/monetization`),

  updateMonetization: (data: Partial<MonetizationData>) =>
    apiFetch<MonetizationData>(`${API}/creator/monetization`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Subscription tiers (creator-owned CRUD)
  listTiers: () => apiFetch<MonetizationTier[]>(`${API}/creator/monetization/tiers`),

  createTier: (data: { name: string; price: number; perks?: string[]; isActive?: boolean }) =>
    apiFetch<MonetizationTier>(`${API}/creator/monetization/tiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTier: (
    id: string,
    data: { name?: string; price?: number; perks?: string[]; isActive?: boolean }
  ) =>
    apiFetch<MonetizationTier>(`${API}/creator/monetization/tiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTier: (id: string) =>
    apiFetch<{ success: boolean }>(`${API}/creator/monetization/tiers/${id}`, {
      method: 'DELETE',
    }),

  // Challenges
  getChallenges: () => apiFetch<Challenge[]>(`${API}/creator/challenges`),

  getChallengeSubmissions: () =>
    apiFetch<ChallengeSubmission[]>(`${API}/creator/challenges/submissions`),

  submitChallenge: (challengeId: string, title: string) =>
    apiFetch<{ success: boolean; submissionId?: string }>(
      `${API}/creator/challenges/${challengeId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    ),

  // Profile
  getProfile: () => apiFetch<CreatorProfile>(`${API}/creator/profile`),

  updateProfile: (data: {
    bio?: string;
    banner?: string;
    displayName?: string;
    avatar?: string;
    website?: string;
    socialLinks?: { twitter?: string; instagram?: string; youtube?: string; tiktok?: string };
  }) =>
    apiFetch<CreatorProfile>(`${API}/creator/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

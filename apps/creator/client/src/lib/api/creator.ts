import { apiFetch } from './base';
import type {
  DashboardStats,
  ContentList,
  AnalyticsData,
  EarningsData,
  PayoutRequest,
  PayoutSettings,
  ContentItem,
  CreatorSettings,
  PayoutsData,
  SubscribersData,
  UploadProgress,
  MonetizationData,
  Challenge,
  ChallengeSubmission,
} from '../creator-types';

const API = '/api/v1';

export const creatorApi = {
  getDashboard: () =>
    apiFetch<DashboardStats>(`${API}/creator/dashboard`),

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

  getAnalytics: (period = '30days') =>
    apiFetch<AnalyticsData>(`${API}/creator/analytics?period=${period}`),

  getEarnings: (period = 'this-month') =>
    apiFetch<EarningsData>(`${API}/creator/earnings?period=${period}`),

  requestPayout: () =>
    apiFetch<PayoutRequest>(`${API}/creator/payouts/request`, {
      method: 'POST',
    }),

  updatePayoutSettings: (data: PayoutSettings) =>
    apiFetch<{ success: boolean }>(`${API}/creator/payouts/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateSettings: (data: CreatorSettings) =>
    apiFetch<{ success: boolean }>(`${API}/creator/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Payouts
  getPayouts: () =>
    apiFetch<PayoutsData>(`${API}/creator/payouts`),

  requestPayoutAmount: (amount: number, method: string) =>
    apiFetch<PayoutRequest>(`${API}/creator/payouts/request`, {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    }),

  // Subscribers
  getSubscribers: () =>
    apiFetch<SubscribersData>(`${API}/creator/subscribers`),

  // Upload
  getUploads: () =>
    apiFetch<UploadProgress[]>(`${API}/creator/uploads`),

  uploadContent: (data: FormData) =>
    apiFetch<UploadProgress>(`${API}/creator/uploads`, {
      method: 'POST',
      body: data,
      headers: {},
    }),

  // Monetization
  getMonetization: () =>
    apiFetch<MonetizationData>(`${API}/creator/monetization`),

  updateMonetization: (data: Partial<MonetizationData>) =>
    apiFetch<{ success: boolean }>(`${API}/creator/monetization`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Challenges
  getChallenges: () =>
    apiFetch<Challenge[]>(`${API}/creator/challenges`),

  getChallengeSubmissions: () =>
    apiFetch<ChallengeSubmission[]>(`${API}/creator/challenges/submissions`),

  submitChallenge: (challengeId: string, title: string) =>
    apiFetch<ChallengeSubmission>(`${API}/creator/challenges/${challengeId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
};

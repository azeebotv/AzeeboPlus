import { apiFetch, type ApiResponse } from './base';
import type {
  DashboardStats,
  ContentList,
  AnalyticsData,
  EarningsData,
  PayoutRequest,
  PayoutSettings,
  ContentItem,
  CreatorSettings,
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
};

import { apiClient } from './client';
import type { ApiResponse } from '../types/api';

export interface BundlePass {
  id: string;
  name: string;
  description: string;
  universeIds: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  duration: number;
  isActive: boolean;
  tier: string;
}

export interface BundleSubscription {
  id: string;
  userId: string;
  bundleId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  bundle: BundlePass;
}

export interface UpgradeQuote {
  bundleId: string;
  bundlePrice: number;
  activeSingleSubscriptions: Array<{
    universe: string;
    paidAmount: number;
    remainingDays: number;
    proratedCredit: number;
  }>;
  totalProratedCredit: number;
  finalAmountDue: number;
  currency: string;
}

export const bundleApi = {
  getBundles: async (): Promise<ApiResponse<BundlePass[]>> => {
    return apiClient.get<ApiResponse<BundlePass[]>>('/subscription/bundles');
  },

  getBundleById: async (id: string): Promise<ApiResponse<BundlePass>> => {
    return apiClient.get<ApiResponse<BundlePass>>(`/subscription/bundles/${id}`);
  },

  getBundleComparison: async (): Promise<
    ApiResponse<{ bundles: BundlePass[]; individualTotal: number; bundleSavings: number }>
  > => {
    return apiClient.get<
      ApiResponse<{ bundles: BundlePass[]; individualTotal: number; bundleSavings: number }>
    >('/subscription/bundles/compare');
  },

  getUpgradeQuote: async (id: string): Promise<ApiResponse<UpgradeQuote>> => {
    return apiClient.get<ApiResponse<UpgradeQuote>>(`/subscription/bundles/${id}/quote`);
  },

  subscribe: async (
    bundleId: string,
    data: {
      autoRenew?: boolean;
      paymentMethod?: 'external' | 'wallet';
      paymentReference?: string;
      applyProration?: boolean;
    }
  ): Promise<ApiResponse<BundleSubscription>> => {
    return apiClient.post<ApiResponse<BundleSubscription>>(
      `/subscription/bundles/${bundleId}/subscribe`,
      data
    );
  },

  cancelSubscription: async (id: string): Promise<ApiResponse<BundleSubscription>> => {
    return apiClient.delete<ApiResponse<BundleSubscription>>(`/subscription/bundles/${id}/cancel`);
  },

  getCurrentBundle: async (): Promise<ApiResponse<BundleSubscription | null>> => {
    return apiClient.get<ApiResponse<BundleSubscription | null>>('/subscription/bundles/current');
  },
};

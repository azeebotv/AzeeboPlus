import type { ApiResponse, RequestClient } from './base';

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

export interface BundleComparison {
  bundles: BundlePass[];
  individualTotal: number;
  bundleSavings: number;
}

export function createBundleMethods(client: RequestClient) {
  return {
    getBundles: async (): Promise<ApiResponse<BundlePass[]>> => {
      return client.request<BundlePass[]>('/api/v1/subscription/bundles');
    },

    getBundleById: async (id: string): Promise<ApiResponse<BundlePass>> => {
      return client.request<BundlePass>(`/api/v1/subscription/bundles/${id}`);
    },

    getBundleComparison: async (): Promise<ApiResponse<BundleComparison>> => {
      return client.request<BundleComparison>('/api/v1/subscription/bundles/compare');
    },

    subscribe: async (
      bundleId: string,
      data: {
        autoRenew?: boolean;
        paymentMethod?: 'external' | 'wallet';
        paymentReference?: string;
      }
    ): Promise<ApiResponse<BundleSubscription>> => {
      return client.request<BundleSubscription>(
        `/api/v1/subscription/bundles/${bundleId}/subscribe`,
        { method: 'POST', body: JSON.stringify(data) }
      );
    },

    cancelSubscription: async (id: string): Promise<ApiResponse<BundleSubscription>> => {
      return client.request<BundleSubscription>(`/api/v1/subscription/bundles/${id}/cancel`, {
        method: 'DELETE',
      });
    },

    getCurrentBundle: async (): Promise<ApiResponse<BundleSubscription | null>> => {
      return client.request<BundleSubscription | null>('/api/v1/subscription/bundles/current');
    },
  };
}

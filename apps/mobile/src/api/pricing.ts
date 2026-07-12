import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface MoviePricing {
  rent48h: { id: string; type: string; price: number; currency: string };
  buy: { id: string; type: string; price: number; currency: string };
  pass: { id: string; type: string; price: number; currency: string; period: string };
}

export interface VotePackage {
  id: string;
  votes: number;
  price: number;
  bonus?: number;
  multiplier?: number;
  name?: string;
  description?: string;
  isPopular?: boolean;
  label?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
}

export interface WalletPricing {
  presetAmounts: number[];
  limits: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
  };
  withdrawalQuickAmounts: number[];
}

export interface PassPricing {
  daily: { id: string; name: string; price: number; currency: string; duration: string };
  weekly: { id: string; name: string; price: number; currency: string; duration: string };
  monthly: { id: string; name: string; price: number; currency: string; duration: string };
}

export const pricingApi = {
  getMoviePricing: async (): Promise<ApiResponse<MoviePricing>> => {
    return apiClient.get<ApiResponse<MoviePricing>>('/api/v1/pricing/movie');
  },

  getVotePackages: async (type: string): Promise<ApiResponse<VotePackage[]>> => {
    return apiClient.get<ApiResponse<VotePackage[]>>(`/api/v1/pricing/vote-packages/${type}`);
  },

  getSubscriptionPlans: async (): Promise<ApiResponse<Record<string, SubscriptionPlan>>> => {
    return apiClient.get<ApiResponse<Record<string, SubscriptionPlan>>>('/api/v1/pricing/subscriptions');
  },

  getWalletPricing: async (): Promise<ApiResponse<WalletPricing>> => {
    return apiClient.get<ApiResponse<WalletPricing>>('/api/v1/pricing/wallet');
  },

  getPassesPricing: async (): Promise<ApiResponse<PassPricing>> => {
    return apiClient.get<ApiResponse<PassPricing>>('/api/v1/pricing/passes');
  },
};

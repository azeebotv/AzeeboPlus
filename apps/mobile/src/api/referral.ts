import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  commissionRate: number;
  referralLink: string;
}

export interface Referral {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  joinedAt: string;
  status: 'pending' | 'active' | 'rewarded';
  earningsGenerated: number;
}

export const referralApi = {
  async getStats(): Promise<ApiResponse<ReferralStats>> {
    const response = await apiClient.get<ReferralStats>('/v1/referrals/stats');
    return { success: true, data: response };
  },

  async getReferrals(): Promise<ApiResponse<Referral[]>> {
    const response = await apiClient.get<Referral[]>('/v1/referrals');
    return { success: true, data: response };
  },

  async getReferralByCode(code: string): Promise<ApiResponse<Referral>> {
    const response = await apiClient.get<Referral>(`/v1/referrals/code/${code}`);
    return { success: true, data: response };
  },

  async generateReferralCode(): Promise<ApiResponse<{ code: string }>> {
    const response = await apiClient.post<{ code: string }>('/v1/referrals/generate-code');
    return { success: true, data: response };
  },
};

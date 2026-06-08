export interface ReferralResponse {
  success: boolean;
  data: unknown;
}

export interface ReferralCodeData {
  id: string;
  code: string;
  isActive: boolean;
  maxUses: number | null;
  currentUses: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralData {
  id: string;
  referrerId: string;
  referredId: string;
  status: string;
  rewardAmount: number;
  rewardStatus: string;
  completedAt: Date | null;
  createdAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  referralCode: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

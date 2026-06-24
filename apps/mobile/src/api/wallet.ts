import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface WalletBalance {
  balance: number;
  currency: string;
  pendingBalance?: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionDetail {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference: string;
  metadata?: {
    source?: string;
    method?: string;
    fee?: number;
    relatedTransactionId?: string;
  };
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  updatedAt?: string;
}

export const walletApi = {
  getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
    return apiClient.get<ApiResponse<WalletBalance>>('/v1/wallet/balance');
  },

  getTransaction: async (id: string): Promise<ApiResponse<TransactionDetail>> => {
    return apiClient.get<ApiResponse<TransactionDetail>>(`/v1/wallet/transactions/${id}`);
  },

  getTransactions: async (
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: Transaction[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    return apiClient.get<
      ApiResponse<{
        items: Transaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/v1/wallet/transactions?page=${page}&limit=${limit}`)
  },

  fundWallet: async (data: {
    amount: number;
    provider: 'paystack' | 'flutterwave';
    email: string;
  }): Promise<ApiResponse<{ authorizationUrl: string; reference: string }>> => {
    return apiClient.post<ApiResponse<{ authorizationUrl: string; reference: string }>>(
      '/v1/wallet/fund',
      data
    );
  },

  withdraw: async (data: {
    amount: number;
    bankCode: string;
    accountNumber: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/v1/wallet/withdraw', data);
  },

  getSummary: async (): Promise<
    ApiResponse<{
      balance: number;
      currency: string;
      pendingBalance: number;
      totalFunded: number;
      totalSpent: number;
      totalWithdrawn: number;
    }>
  > => {
    return apiClient.get<
      ApiResponse<{
        balance: number;
        currency: string;
        pendingBalance: number;
        totalFunded: number;
        totalSpent: number;
        totalWithdrawn: number;
      }>
    >('/v1/wallet/summary')
  },

  redeemReward: async (data: {
    points: number;
  }): Promise<ApiResponse<{ message: string; creditedAmount: number }>> => {
    return apiClient.post<ApiResponse<{ message: string; creditedAmount: number }>>(
      '/v1/wallet/redeem-reward',
      data
    );
  },

  transfer: async (data: {
    recipientId: string;
    amount: number;
    description?: string;
  }): Promise<ApiResponse<{ message: string; transactionId: string }>> => {
    return apiClient.post<ApiResponse<{ message: string; transactionId: string }>>(
      '/v1/wallet/transfer',
      data
    );
  },
};

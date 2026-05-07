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

export const walletApi = {
  getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
    return apiClient.get<ApiResponse<WalletBalance>>('/wallet/balance');
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
    >(`/wallet/transactions?page=${page}&limit=${limit}`);
  },

  fundWallet: async (data: {
    amount: number;
    provider: 'paystack' | 'flutterwave';
    email: string;
  }): Promise<ApiResponse<{ authorizationUrl: string; reference: string }>> => {
    return apiClient.post<ApiResponse<{ authorizationUrl: string; reference: string }>>(
      '/wallet/fund',
      data
    );
  },

  withdraw: async (data: {
    amount: number;
    bankCode: string;
    accountNumber: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/wallet/withdraw', data);
  },
};

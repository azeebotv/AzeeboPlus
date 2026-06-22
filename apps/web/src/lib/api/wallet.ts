// Wallet domain methods

import type {
  ApiResponse,
  PaginatedResponse,
  PaymentInitResponse,
  RequestClient,
  Transaction,
  WalletBalance,
} from './base';

export function createWalletMethods(client: RequestClient) {
  return {
    getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
      return client.request<WalletBalance>('/api/v1/wallet');
    },

    getTransactions: async (
      page = 1,
      limit = 20,
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return client.request<PaginatedResponse<Transaction>>(
        `/api/v1/wallet/transactions?page=${page}&limit=${limit}`,
      );
    },

    fundWallet: async (
      amount: number,
      paymentMethod: string,
    ): Promise<ApiResponse<PaymentInitResponse>> => {
      return client.request<PaymentInitResponse>('/api/v1/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
    },

    withdraw: async (
      amount: number,
      bankDetails: Record<string, string>,
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, bankDetails }),
      });
    },

    transfer: async (
      amount: number,
      recipientId: string,
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ amount, recipientId }),
      });
    },

    getTransaction: async (transactionId: string): Promise<ApiResponse<Transaction>> => {
      return client.request<Transaction>(`/api/v1/wallet/transactions/${transactionId}`);
    },

    getEarnings: async (params: {
      range: string;
    }): Promise<
      ApiResponse<{
        totalEarnings: number;
        pendingEarnings: number;
        withdrawableBalance: number;
        withdrawableChangePercentage: number;
        avgEarningPerContent: number;
        avgEarningChangePercentage: number;
        earningsTrend: { date: string; amount: number }[];
      }>
    > => {
      return client.request<{
        totalEarnings: number;
        pendingEarnings: number;
        withdrawableBalance: number;
        withdrawableChangePercentage: number;
        avgEarningPerContent: number;
        avgEarningChangePercentage: number;
        earningsTrend: { date: string; amount: number }[];
      }>(`/api/v1/wallet/earnings?range=${params.range}`);
    },
  };
}

// Wallet domain methods

import type {
  ApiResponse,
  PaginatedResponse,
  PaymentInitResponse,
  RequestClient,
  RetryOptions,
  Transaction,
  WalletBalance,
} from './base';

// Read-only wallet operations skip retries to avoid connection pool exhaustion
// when the wallet-service is temporarily down. Fail immediately so the UI can
// show stale/default data instead of blocking for 7+ seconds on retry backoff.
const WALLET_READ_RETRY: RetryOptions = { skipRetry: true };

export function createWalletMethods(client: RequestClient) {
  return {
    getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
      return client.request<WalletBalance>('/api/v1/wallet', {}, WALLET_READ_RETRY);
    },

    getTransactions: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return client.request<PaginatedResponse<Transaction>>(
        `/api/v1/wallet/transactions?page=${page}&limit=${limit}`,
        {},
        WALLET_READ_RETRY
      );
    },

    fundWallet: async (
      amount: number,
      paymentMethod: string
    ): Promise<ApiResponse<PaymentInitResponse>> => {
      return client.request<PaymentInitResponse>('/api/v1/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
    },

    withdraw: async (
      amount: number,
      bankDetails: Record<string, string>
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, bankDetails }),
      });
    },

    transfer: async (
      amount: number,
      recipientId: string
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ amount, recipientId }),
      });
    },

    getTransaction: async (transactionId: string): Promise<ApiResponse<Transaction>> => {
      return client.request<Transaction>(
        `/api/v1/wallet/transactions/${transactionId}`,
        {},
        WALLET_READ_RETRY
      );
    },
  };
}

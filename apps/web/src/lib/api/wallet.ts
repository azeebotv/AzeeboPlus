// Wallet domain methods

import { generateIdempotencyKey } from './base';
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

    // The server requires a client idempotency key on withdraw/transfer
    // (AUD-03). Callers performing a user-visible action should generate one
    // key per intent and pass it here so their retries dedupe; the default
    // per-call key only satisfies the contract.
    withdraw: async (
      amount: number,
      bankDetails: Record<string, string>,
      idempotencyKey: string = generateIdempotencyKey()
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, bankDetails, idempotencyKey }),
      });
    },

    transfer: async (
      amount: number,
      recipientId: string,
      idempotencyKey: string = generateIdempotencyKey()
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ amount, recipientId, idempotencyKey }),
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

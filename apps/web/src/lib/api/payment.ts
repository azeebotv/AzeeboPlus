// Payment domain methods

import type {
  ApiResponse,
  PaginatedResponse,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerifyResponse,
  RequestClient,
  Transaction,
} from './base';

export function createPaymentMethods(client: RequestClient) {
  return {
    initialize: async (data: PaymentInitRequest): Promise<ApiResponse<PaymentInitResponse>> => {
      return client.request<PaymentInitResponse>('/api/v1/payments/initialize', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    verify: async (reference: string): Promise<ApiResponse<PaymentVerifyResponse>> => {
      return client.request<PaymentVerifyResponse>(
        `/api/v1/payments/verify?reference=${reference}`
      );
    },

    getTransactions: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
      return client.request<PaginatedResponse<Transaction>>(
        `/api/v1/payments/history?page=${page}&limit=${limit}`
      );
    },

    getPayment: async (paymentId: string): Promise<ApiResponse<Transaction>> => {
      return client.request<Transaction>(`/api/v1/payments/${paymentId}`);
    },

    getProviders: async (): Promise<ApiResponse<{ provider: string; name: string }[]>> => {
      return client.request<{ provider: string; name: string }[]>('/api/v1/payments/providers');
    },
  };
}

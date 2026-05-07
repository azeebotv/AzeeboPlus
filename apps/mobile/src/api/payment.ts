import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface PaymentInitResponse {
  reference: string;
  authorizationUrl: string;
  accessCode?: string;
  amount: number;
  currency: string;
  email: string;
}

export interface PaymentVerifyResponse {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  currency: string;
  customerEmail: string;
  paidAt?: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'paystack' | 'flutterwave';
  reference: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export const paymentApi = {
  initialize: async (data: {
    amount: number;
    currency: string;
    email: string;
    metadata?: Record<string, string>;
  }): Promise<ApiResponse<PaymentInitResponse>> => {
    return apiClient.post<ApiResponse<PaymentInitResponse>>('/payments/initialize', data);
  },

  verify: async (reference: string): Promise<ApiResponse<PaymentVerifyResponse>> => {
    return apiClient.get<ApiResponse<PaymentVerifyResponse>>(`/payments/verify/${reference}`);
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
    >(`/payments/transactions?page=${page}&limit=${limit}`);
  },

  getProviders: async (): Promise<ApiResponse<{ provider: string; name: string }[]>> => {
    return apiClient.get<ApiResponse<{ provider: string; name: string }[]>>('/payments/providers');
  },
};

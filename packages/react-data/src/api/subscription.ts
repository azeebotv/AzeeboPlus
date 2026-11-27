import { apiClient } from './client';
import type { ApiResponse, SubscriptionPlan } from '../types/api';

export type { SubscriptionPlan } from '../types/api';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  lastPaymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
}

export interface SubscribeToPlanDto {
  planId: string;
  autoRenew?: boolean;
  paymentMethod?: 'external' | 'wallet';
  paymentReference?: string;
}

export const subscriptionApi = {
  async getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const response = await apiClient.get<SubscriptionPlan[]>('/v1/subscription/plans');
    return { success: true, data: response };
  },

  async getPlanById(id: string): Promise<ApiResponse<SubscriptionPlan>> {
    const response = await apiClient.get<SubscriptionPlan>(`/v1/subscription/plans/${id}`);
    return { success: true, data: response };
  },

  async getCurrentSubscription(): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.get<Subscription>('/v1/subscription/current');
    return { success: true, data: response };
  },

  async subscribe(dto: SubscribeToPlanDto): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<Subscription>('/v1/subscription/subscribe', dto);
    return { success: true, data: response };
  },

  async renewSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<Subscription>(
      `/v1/subscription/renew/${subscriptionId}`,
      {}
    );
    return { success: true, data: response };
  },

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<{ message: string }>(
      `/v1/subscription/${subscriptionId}`
    );
    return { success: true, data: response };
  },

  async getSubscriptionHistory(
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      subscriptions: Subscription[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  > {
    const response = await apiClient.get<{
      subscriptions: Subscription[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/v1/subscription/history?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },
};

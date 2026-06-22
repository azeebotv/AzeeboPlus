import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  isActive: boolean;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
}

export interface SubscribeToPlanDto {
  planId: string;
  autoRenew?: boolean;
  paymentMethod?: string;
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
      items: Subscription[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const response = await apiClient.get<{
      items: Subscription[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/subscription/history?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },
};

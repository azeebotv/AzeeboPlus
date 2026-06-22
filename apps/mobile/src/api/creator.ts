import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  category: string;
  contentType: string;
  socialLinks?: Record<string, string>;
  goals?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface OnboardData {
  category: string;
  contentType: string;
  displayName: string;
  bio?: string;
  socialLink?: string;
  goals?: string;
}

export interface CreatorDashboard {
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    thumbnail?: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface CreatorAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    thumbnail?: string;
  }>;
  viewsOverTime: { date: string; views: number }[];
}

export interface CreatorEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  currency: string;
  earningsHistory: { date: string; amount: number; type: string }[];
}

export interface CreatorContentItem {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  thumbnail?: string;
  mediaUrl?: string;
  contentType: string;
  universe: string;
  publishedAt?: string;
  scheduledAt?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export const creatorApi = {
  onboard: async (data: OnboardData): Promise<ApiResponse<CreatorProfile>> => {
    return apiClient.post<ApiResponse<CreatorProfile>>('/creators/onboard', data);
  },

  getProfile: async (): Promise<ApiResponse<CreatorProfile>> => {
    return apiClient.get<ApiResponse<CreatorProfile>>('/creators/profile');
  },

  updateProfile: async (data: Partial<CreatorProfile>): Promise<ApiResponse<CreatorProfile>> => {
    return apiClient.put<ApiResponse<CreatorProfile>>('/creators/profile', data);
  },

  getDashboard: async (): Promise<ApiResponse<CreatorDashboard>> => {
    return apiClient.get<ApiResponse<CreatorDashboard>>('/creators/dashboard');
  },

  getContent: async (
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: CreatorContentItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    return apiClient.get<
      ApiResponse<{
        items: CreatorContentItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/creators/content?page=${page}&limit=${limit}`);
  },

  getAnalytics: async (): Promise<ApiResponse<CreatorAnalytics>> => {
    return apiClient.get<ApiResponse<CreatorAnalytics>>('/creators/analytics');
  },

  getEarnings: async (): Promise<ApiResponse<CreatorEarnings>> => {
    return apiClient.get<ApiResponse<CreatorEarnings>>('/creators/earnings');
  },
};

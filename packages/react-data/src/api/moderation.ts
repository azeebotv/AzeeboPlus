import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface ReportReason {
  id: string;
  label: string;
}

export interface ReportData {
  contentType: string;
  contentId: string;
  reasonId: string;
  description: string;
}

export interface Report {
  id: string;
  contentType: string;
  contentId: string;
  contentTitle?: string;
  contentThumbnail?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string[];
  thumbnail?: string;
  rewardPoints: number;
  rewardDescription?: string;
  participantCount: number;
  maxParticipants?: number;
  status: 'active' | 'upcoming' | 'ended';
  startDate: string;
  endDate: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  contentUrl: string;
  description: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  subscribedAt: string;
  plan?: string;
  isGifted?: boolean;
}

export interface SubscriberStats {
  totalSubscribers: number;
  newThisWeek: number;
  newThisMonth: number;
  churnRate: number;
  demographics: {
    ageGroups: { range: string; count: number; percentage: number }[];
    topRegions: { region: string; count: number; percentage: number }[];
  };
}

export interface CreatorSubscriberData {
  stats: SubscriberStats;
  subscribers: Subscriber[];
}

export const moderationApi = {
  getReportReasons: async (): Promise<ApiResponse<ReportReason[]>> => {
    const response = await apiClient.get<ReportReason[]>('/v1/moderation/reasons');
    return { success: true, data: response };
  },

  submitReport: async (data: ReportData): Promise<ApiResponse<Report>> => {
    const response = await apiClient.post<Report>('/v1/moderation/reports', data);
    return { success: true, data: response };
  },

  getUserReports: async (
    page = 1,
    limit = 20,
    status?: string
  ): Promise<
    ApiResponse<{
      items: Report[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const response = await apiClient.get<{
      items: Report[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/moderation/reports?${params.toString()}`);
    return { success: true, data: response };
  },

  getActiveChallenges: async (
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: Challenge[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const response = await apiClient.get<{
      items: Challenge[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/challenges/active?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },

  getChallengeDetail: async (challengeId: string): Promise<ApiResponse<Challenge>> => {
    const response = await apiClient.get<Challenge>(`/v1/challenges/${challengeId}`);
    return { success: true, data: response };
  },

  submitChallengeEntry: async (data: {
    challengeId: string;
    contentUrl: string;
    description: string;
  }): Promise<ApiResponse<ChallengeSubmission>> => {
    // Backend contract: POST /challenges/:id/submit with { content, mediaUrl? }
    // (lifestyle-service ChallengeController), not a bare /challenges/submit.
    const response = await apiClient.post<ChallengeSubmission>(
      `/v1/challenges/${data.challengeId}/submit`,
      { content: data.description, mediaUrl: data.contentUrl }
    );
    return { success: true, data: response };
  },

  getChallengeSubmissions: async (
    challengeId: string,
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: ChallengeSubmission[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const response = await apiClient.get<{
      items: ChallengeSubmission[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/challenges/${challengeId}/submissions?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },

  getMySubmissions: async (
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: ChallengeSubmission[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const response = await apiClient.get<{
      items: ChallengeSubmission[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/challenges/my-submissions?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },

  getCreatorSubscribers: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<CreatorSubscriberData>> => {
    const response = await apiClient.get<CreatorSubscriberData>(
      `/v1/creator/subscribers?page=${page}&limit=${limit}`
    );
    return { success: true, data: response };
  },

  getSubscriberStats: async (): Promise<ApiResponse<SubscriberStats>> => {
    const response = await apiClient.get<SubscriberStats>('/v1/creator/subscribers/stats');
    return { success: true, data: response };
  },
};

import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  category?: string;
}

export interface RankingCategory {
  id: string;
  name: string;
  icon: string;
  entries: Array<{
    rank: number;
    userId: string;
    displayName: string;
    avatar: string;
    score: number;
    change: number;
  }>;
}

export interface PredictionResult {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  status: 'active' | 'completed';
  correctOption?: string;
  userPrediction?: string;
  isCorrect?: boolean;
}

export const engagementApi = {
  async getLeaderboard(timePeriod = 'weekly', category = 'all'): Promise<ApiResponse<LeaderboardEntry[]>> {
    const response = await apiClient.get<LeaderboardEntry[]>(
      `/v1/engagement/leaderboard?timePeriod=${timePeriod}&category=${category}`
    );
    return { success: true, data: response };
  },

  async getRankings(): Promise<ApiResponse<RankingCategory[]>> {
    const response = await apiClient.get<RankingCategory[]>('/v1/engagement/rankings');
    return { success: true, data: response };
  },

  async getPredictionResults(predictionId: string): Promise<ApiResponse<PredictionResult>> {
    const response = await apiClient.get<PredictionResult>(`/v1/reality/predictions/${predictionId}/results`);
    return { success: true, data: response };
  },
};

export interface RealityShow {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: 'live' | 'upcoming' | 'ended';
  startTime: string;
  endTime?: string;
  viewerCount: number;
  seasonNumber: number;
  episodeNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface RealityEpisode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  thumbnail: string;
  releaseDate: string;
  isLocked: boolean;
  showId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealityContestant {
  id: string;
  name: string;
  description: string;
  avatar: string;
  votes: number;
  rank: number;
  eliminated?: boolean;
  showId: string;
  createdAt: string;
  updatedAt: string;
}

export const realityApi = {
  async getLiveViewerCount(showId: string): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.get<{ count: number }>(`/v1/reality/shows/${showId}/viewers`);
    return { success: true, data: response };
  },

  async getShowDetails(showId: string): Promise<ApiResponse<RealityShow>> {
    const response = await apiClient.get<RealityShow>(`/v1/reality/shows/${showId}`);
    return { success: true, data: response };
  },

  async getEpisodes(showId: string): Promise<ApiResponse<RealityEpisode[]>> {
    const response = await apiClient.get<RealityEpisode[]>(`/v1/reality/shows/${showId}/episodes`);
    return { success: true, data: response };
  },

  async getContestants(showId: string): Promise<ApiResponse<RealityContestant[]>> {
    const response = await apiClient.get<RealityContestant[]>(`/v1/reality/shows/${showId}/contestants`);
    return { success: true, data: response };
  },

  async getPredictionResults(predictionId: string): Promise<ApiResponse<PredictionResult>> {
    const response = await apiClient.get<PredictionResult>(`/v1/reality/predictions/${predictionId}/results`);
    return { success: true, data: response };
  },
};

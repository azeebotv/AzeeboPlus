import { apiClient } from './client';
import type { ApiResponse } from './auth';
import type { ContentItem } from './content';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  name?: string;
  avatar: string;
  score: number;
  category?: string;
  isYou?: boolean;
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
    label?: string;
    avatar?: string;
    odds?: string;
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
  async getLeaderboard(
    timePeriod = 'weekly',
    category = 'all'
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    return apiClient.get<ApiResponse<LeaderboardEntry[]>>(
      `/api/v1/engagement/leaderboard?timePeriod=${timePeriod}&category=${category}`
    );
  },

  async getRankings(): Promise<ApiResponse<RankingCategory[]>> {
    return apiClient.get<ApiResponse<RankingCategory[]>>('/api/v1/engagement/rankings');
  },

  async getPredictionResults(predictionId: string): Promise<ApiResponse<PredictionResult>> {
    return apiClient.get<ApiResponse<PredictionResult>>(
      `/api/v1/engagement/predictions/${predictionId}/results`
    );
  },

  async placeBet(data: {
    predictionId: string;
    optionId: string;
    amount: number;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<ApiResponse<{ success: boolean }>>(
      '/api/v1/engagement/predictions',
      data
    );
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
    return apiClient.get<ApiResponse<{ count: number }>>(`/api/v1/reality/shows/${showId}/viewers`);
  },

  async getShowDetails(showId: string): Promise<ApiResponse<RealityShow>> {
    return apiClient.get<ApiResponse<RealityShow>>(`/api/v1/reality/shows/${showId}`);
  },

  async getEpisodes(showId: string): Promise<ApiResponse<RealityEpisode[]>> {
    return apiClient.get<ApiResponse<RealityEpisode[]>>(`/api/v1/reality/shows/${showId}/episodes`);
  },

  async getContestants(showId: string): Promise<ApiResponse<RealityContestant[]>> {
    return apiClient.get<ApiResponse<RealityContestant[]>>(
      `/api/v1/reality/shows/${showId}/contestants`
    );
  },

  async getPredictionResults(predictionId: string): Promise<ApiResponse<PredictionResult>> {
    return apiClient.get<ApiResponse<PredictionResult>>(
      `/api/v1/reality/predictions/${predictionId}/results`
    );
  },

  async submitVote(data: {
    showId: string;
    contestantId: string | null;
    votes: number;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<ApiResponse<{ success: boolean }>>(
      `/api/v1/reality/shows/${data.showId}/vote`,
      { contestantId: data.contestantId, votes: data.votes }
    );
  },
};

// ── Homepage Engagement Types ────────────────────────────────

export interface EngagementHistoryItem {
  contentId: string;
  progress: number;
  lastWatchedAt: string;
  content: ContentItem;
}

export interface UserUniverseEngagement {
  universeId: string;
  universeName: string;
  universeIcon?: string;
  engagementCount: number;
  lastEngagedAt: string;
}

export interface RecommendationGroup {
  title: string;
  reason: string;
  items: ContentItem[];
}

// ── Homepage Engagement API ──────────────────────────────────

export const homepageEngagementApi = {
  getRecentlyWatched: async (
    limit = 10,
    offset = 0
  ): Promise<ApiResponse<{ items: EngagementHistoryItem[]; hasMore: boolean }>> => {
    return apiClient.get<ApiResponse<{ items: EngagementHistoryItem[]; hasMore: boolean }>>(
      `/api/v1/users/me/history?limit=${limit}&offset=${offset}`
    );
  },

  getUniverseEngagement: async (): Promise<ApiResponse<UserUniverseEngagement[]>> => {
    return apiClient.get<ApiResponse<UserUniverseEngagement[]>>('/api/v1/users/me/universes');
  },

  getContentByUniverse: async (
    universeId: string,
    limit = 12
  ): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(
      `/api/v1/content/universe/${universeId}?limit=${limit}&sort=trending`
    );
  },

  getNewReleases: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
    const response = await apiClient.get<ContentItem[]>(
      `/api/v1/content/new-releases?limit=${limit}`
    );
    return { success: true, data: response };
  },

  getContinueWatching: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
    const response = await apiClient.get<ContentItem[]>(
      `/api/v1/users/me/continue-watching?limit=${limit}`
    );
    return { success: true, data: response };
  },

  getPopularInRegion: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
    const response = await apiClient.get<ContentItem[]>(
      `/api/v1/content/popular-region?limit=${limit}`
    );
    return { success: true, data: response };
  },

  getPersonalizedRecommendations: async (): Promise<ApiResponse<RecommendationGroup[]>> => {
    const response = await apiClient.get<RecommendationGroup[]>(
      '/api/v1/recommendation/personalized-feed'
    );
    return { success: true, data: response };
  },

  getFeaturedSlides: async (limit = 5): Promise<ApiResponse<ContentItem[]>> => {
    const response = await apiClient.get<ContentItem[]>(
      `/api/v1/content/featured-slides?limit=${limit}`
    );
    return { success: true, data: response };
  },
};

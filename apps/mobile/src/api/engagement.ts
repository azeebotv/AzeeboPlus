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
    const response = await apiClient.get<LeaderboardEntry[]>(
      `/api/v1/engagement/leaderboard?timePeriod=${timePeriod}&category=${category}`
    );
    return { success: true, data: response };
  },

  async getRankings(): Promise<ApiResponse<RankingCategory[]>> {
    const response = await apiClient.get<RankingCategory[]>('/api/v1/engagement/rankings');
    return { success: true, data: response };
  },

  async getPredictionResults(predictionId: string): Promise<ApiResponse<PredictionResult>> {
    const response = await apiClient.get<PredictionResult>(
      `/api/v1/engagement/predictions/${predictionId}/results`
    );
    return { success: true, data: response };
  },

  async placeBet(data: {
    predictionId: string;
    optionId: string;
    amount: number;
  }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.post<{ success: boolean }>(
      '/api/v1/engagement/predictions/bet',
      data
    );
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
    const response = await apiClient.get<{ count: number }>(
      `/api/v1/reality/shows/${showId}/viewers`
    );
    return { success: true, data: response };
  },

  async getShowDetails(showId: string): Promise<ApiResponse<RealityShow>> {
    const response = await apiClient.get<RealityShow>(`/api/v1/reality/shows/${showId}`);
    return { success: true, data: response };
  },

  async getEpisodes(showId: string): Promise<ApiResponse<RealityEpisode[]>> {
    const response = await apiClient.get<RealityEpisode[]>(
      `/api/v1/reality/shows/${showId}/episodes`
    );
    return { success: true, data: response };
  },

  async getContestants(showId: string): Promise<ApiResponse<RealityContestant[]>> {
    const response = await apiClient.get<RealityContestant[]>(
      `/api/v1/reality/shows/${showId}/contestants`
    );
    return { success: true, data: response };
  },

  async getPredictionResults(predictionId: string): Promise<ApiResponse<PredictionResult>> {
    const response = await apiClient.get<PredictionResult>(
      `/api/v1/reality/predictions/${predictionId}/results`
    );
    return { success: true, data: response };
  },

  async submitVote(data: {
    showId: string;
    contestantId: string | null;
    votes: number;
  }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.post<{ success: boolean }>(
      `/api/v1/reality/shows/${data.showId}/vote`,
      { contestantId: data.contestantId, votes: data.votes }
    );
    return { success: true, data: response };
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
    const response = await apiClient.get<{ items: EngagementHistoryItem[]; hasMore: boolean }>(
      `/api/v1/users/me/history?limit=${limit}&offset=${offset}`
    );
    return { success: true, data: response };
  },

  getUniverseEngagement: async (): Promise<ApiResponse<UserUniverseEngagement[]>> => {
    const response = await apiClient.get<UserUniverseEngagement[]>('/api/v1/users/me/universes');
    return { success: true, data: response };
  },

  getContentByUniverse: async (
    universeId: string,
    limit = 12
  ): Promise<ApiResponse<ContentItem[]>> => {
    const response = await apiClient.get<ContentItem[]>(
      `/api/v1/content/universe/${universeId}?limit=${limit}&sort=trending`
    );
    return { success: true, data: response };
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
      '/api/v1/recommendation/personalized'
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

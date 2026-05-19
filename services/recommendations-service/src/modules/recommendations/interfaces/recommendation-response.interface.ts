export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations?: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      thumbnail?: string;
      score?: number;
      reason?: string;
    }>;
    creators?: Array<{
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
      followerCount?: number;
      reason?: string;
    }>;
    crossUniverse?: Array<{
      id: string;
      universe: string;
      type: string;
      title: string;
      thumbnail?: string;
      relevanceScore?: number;
    }>;
    meta?: {
      total: number;
      algorithm: string;
      generatedAt: string;
    };
  };
}

export interface RecommendationResponse {
  success: boolean;
  data: unknown;
}

export interface ContentRecommendationResponse extends RecommendationResponse {
  data: {
    id: string;
    title: string;
    description: string;
    status: string;
    viewCount: number;
    creator: {
      id: string;
      displayName: string;
      avatar: string;
    };
    universe: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

export interface CreatorRecommendationResponse extends RecommendationResponse {
  data: {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    avatar: string;
    followerCount: number;
    user: {
      id: string;
      email: string;
    };
  }[];
}

export interface PersonalizedFeedResponse extends RecommendationResponse {
  data: {
    content: ContentRecommendationResponse['data'];
    creators: CreatorRecommendationResponse['data'];
  };
}

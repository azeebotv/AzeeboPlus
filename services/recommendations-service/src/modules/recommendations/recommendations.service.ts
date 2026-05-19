import { Injectable } from '@nestjs/common';
import { RecommendationResponse } from './interfaces/recommendation-response.interface';

@Injectable()
export class RecommendationsService {
  async getCreatorRecommendations(userId: string, limit = 20): Promise<RecommendationResponse> {
    const creators = [
      {
        id: 'creator-1',
        username: 'topcreator1',
        displayName: 'Top Creator One',
        avatar: 'https://example.com/avatar1.jpg',
        followerCount: 15000,
        reason: 'Popular in your interests',
      },
      {
        id: 'creator-2',
        username: 'trendingcreator',
        displayName: 'Trending Creator',
        avatar: 'https://example.com/avatar2.jpg',
        followerCount: 8500,
        reason: 'Trending now',
      },
      {
        id: 'creator-3',
        username: 'newcreator',
        displayName: 'New Creator',
        avatar: 'https://example.com/avatar3.jpg',
        followerCount: 1200,
        reason: 'Rising creator',
      },
    ];

    return {
      success: true,
      data: {
        creators: creators.slice(0, limit),
        meta: {
          total: creators.length,
          algorithm: 'popularity-based',
          generatedAt: new Date().toISOString(),
        },
      },
    };
  }

  async getCrossUniverseRecommendations(userId: string, limit = 20): Promise<RecommendationResponse> {
    const recommendations = [
      {
        id: 'rec-1',
        universe: 'sports',
        type: 'content',
        title: 'Top Sports Moment',
        thumbnail: 'https://example.com/sports1.jpg',
        relevanceScore: 0.95,
      },
      {
        id: 'rec-2',
        universe: 'comedy',
        type: 'content',
        title: 'Comedy Special Highlight',
        thumbnail: 'https://example.com/comedy1.jpg',
        relevanceScore: 0.88,
      },
      {
        id: 'rec-3',
        universe: 'movie',
        type: 'content',
        title: 'Movie Trailer Premiere',
        thumbnail: 'https://example.com/movie1.jpg',
        relevanceScore: 0.82,
      },
    ];

    return {
      success: true,
      data: {
        crossUniverse: recommendations.slice(0, limit),
        meta: {
          total: recommendations.length,
          algorithm: 'cross-universe-collaborative',
          generatedAt: new Date().toISOString(),
        },
      },
    };
  }
}

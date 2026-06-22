import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../database/prisma.service';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

describe('Recommendation Service Integration Tests', () => {
  let app: INestApplication;

  const mockRecommendationService = {
    getContentRecommendations: jest.fn(),
    getCreatorRecommendations: jest.fn(),
    getCrossUniverseRecommendations: jest.fn(),
    getUserSegment: jest.fn(),
    getCreatorScore: jest.fn(),
    getChurnRisk: jest.fn(),
    getMonetizationInsights: jest.fn(),
    assessFraudRisk: jest.fn(),
    getPersonalizedFeed: jest.fn(),
  };

  const mockPrismaService = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [
        {
          provide: RecommendationService,
          useValue: mockRecommendationService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /recommendation/content', () => {
    it('should return content recommendations', async () => {
      mockRecommendationService.getContentRecommendations.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'content-1',
            title: 'Recommended Video',
            description: 'Based on your watch history',
            thumbnail: 'https://example.com/thumb.jpg',
            creator: {
              id: 'creator-1',
              displayName: 'Test Creator',
              avatar: 'https://example.com/avatar.jpg',
            },
            universe: { id: 'universe-1', name: 'Reality', slug: 'reality' },
            score: 0.95,
            explainability: {
              factors: [{ name: 'watch_history', weight: 0.6 }],
              reason: 'Based on your viewing patterns',
            },
            freshnessScore: 0.8,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/recommendation/content')
        .query({ userId: 'user-123', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return fallback recommendations without userId', async () => {
      mockRecommendationService.getContentRecommendations.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'content-1',
            title: 'Popular Content',
            description: 'Trending now',
            thumbnail: 'https://example.com/thumb.jpg',
            creator: {
              id: 'creator-1',
              displayName: 'Test Creator',
              avatar: 'https://example.com/avatar.jpg',
            },
            universe: { id: 'universe-1', name: 'Reality', slug: 'reality' },
            score: 0.9,
            explainability: {
              factors: [{ name: 'trending', weight: 0.8 }],
              reason: 'Trending content',
            },
            freshnessScore: 0.9,
          },
        ],
      });

      const response = await request(app.getHttpServer()).get('/recommendation/content');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /recommendation/creators', () => {
    it('should return creator recommendations', async () => {
      mockRecommendationService.getCreatorRecommendations.mockResolvedValue({
        success: true,
        data: [
          {
            creatorId: 'creator-1',
            score: 0.95,
            factors: [{ name: 'engagement', weight: 0.5, value: 0.9 }],
            tier: 'elite',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/recommendation/creators')
        .query({ userId: 'user-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /recommendation/cross-universe', () => {
    it('should return cross-universe recommendations', async () => {
      mockRecommendationService.getCrossUniverseRecommendations.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'content-1',
            title: 'Cross Universe Content',
            description: 'From multiple universes',
            thumbnail: 'https://example.com/thumb.jpg',
            creator: {
              id: 'creator-1',
              displayName: 'Test Creator',
              avatar: 'https://example.com/avatar.jpg',
            },
            universe: { id: 'universe-1', name: 'Reality', slug: 'reality' },
            score: 0.85,
            explainability: {
              factors: [{ name: 'cross_universe', weight: 0.7 }],
              reason: 'Similar content across universes',
            },
            freshnessScore: 0.7,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/recommendation/cross-universe')
        .query({ userId: 'user-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /recommendation/personalized-feed', () => {
    it('should return personalized feed', async () => {
      mockRecommendationService.getPersonalizedFeed.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'content-1',
            title: 'Feed Item 1',
            description: 'Personalized for you',
            thumbnail: 'https://example.com/thumb.jpg',
            creator: {
              id: 'creator-1',
              displayName: 'Test Creator',
              avatar: 'https://example.com/avatar.jpg',
            },
            universe: { id: 'universe-1', name: 'Reality', slug: 'reality' },
            score: 0.92,
            explainability: {
              factors: [{ name: 'personalized', weight: 0.8 }],
              reason: 'Based on your preferences',
            },
            freshnessScore: 0.85,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/recommendation/personalized-feed')
        .query({ userId: 'user-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockRecommendationService.getContentRecommendations.mockRejectedValue(
        new Error('Recommendation engine unavailable')
      );

      const response = await request(app.getHttpServer()).get('/recommendation/content');

      expect(response.status).toBe(500);
    });

    it('should handle concurrent requests safely', async () => {
      mockRecommendationService.getContentRecommendations.mockResolvedValue({
        success: true,
        data: [],
      });

      const promises = Array(3)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/recommendation/content'));

      const results = await Promise.all(promises);

      results.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});

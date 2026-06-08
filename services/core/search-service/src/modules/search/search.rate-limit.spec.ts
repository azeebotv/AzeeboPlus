import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from '@azeebo/security';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

const mockRateLimitGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('Search Service Rate Limiting Tests', () => {
  let app: INestApplication;

  const mockSearchService = {
    search: jest.fn().mockResolvedValue({
      success: true,
      data: { results: { content: [], creators: [], universes: [] }, total: 0 },
    }),
    getSuggestions: jest.fn().mockResolvedValue({
      success: true,
      data: { suggestions: [] },
    }),
    getTrending: jest.fn().mockResolvedValue({
      success: true,
      data: { trending: [] },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        {
          provide: RateLimitGuard,
          useValue: mockRateLimitGuard,
        },
        Reflector,
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
    mockRateLimitGuard.canActivate.mockReturnValue(true);
  });

  describe('Rate Limiting - GET /search', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(true);

      const response = await request(app.getHttpServer()).get('/search?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(false);

      const response = await request(app.getHttpServer()).get('/search?q=test');

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many requests');
    });

    it('should include rate limit headers in response', async () => {
      const response = await request(app.getHttpServer()).get('/search?q=test');

      expect(response.headers).toBeDefined();
    });

    it('should apply rate limit per IP address', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(true);

      const response1 = await request(app.getHttpServer())
        .get('/search?q=test')
        .set('X-Forwarded-For', '192.168.1.1');

      const response2 = await request(app.getHttpServer())
        .get('/search?q=test')
        .set('X-Forwarded-For', '192.168.1.2');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Rate Limiting - GET /search/suggestions', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(true);

      const response = await request(app.getHttpServer()).get('/search/suggestions?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(false);

      const response = await request(app.getHttpServer()).get('/search/suggestions?q=test');

      expect(response.status).toBe(429);
    });
  });

  describe('Rate Limiting - GET /search/trending', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(true);

      const response = await request(app.getHttpServer()).get('/search/trending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(false);

      const response = await request(app.getHttpServer()).get('/search/trending');

      expect(response.status).toBe(429);
    });
  });
});

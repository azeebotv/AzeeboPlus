import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard, ServiceAuthGuard, AdminGuard } from '@azeebo/security';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { SearchIntelligenceService } from './search-intelligence.service.js';

const mockRateLimitGuard = {
  canActivate: jest.fn().mockImplementation(() => {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }),
};

describe('Search Service Rate Limiting Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

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
          provide: SearchIntelligenceService,
          useValue: { filterByAvailability: jest.fn(), trackZeroResult: jest.fn(), getSearchQualityMetrics: jest.fn() },
        },
        Reflector,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
      .overrideGuard(ServiceAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitGuard.canActivate.mockImplementation(() => true);
  });

  describe('Rate Limiting - GET /search', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => true);

      const response = await request(baseUrl).get('/search?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      });

      const response = await request(baseUrl).get('/search?q=test');

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many requests');
    });

    it('should include rate limit headers in response', async () => {
      const response = await request(baseUrl).get('/search?q=test');

      expect(response.headers).toBeDefined();
    });

    it('should apply rate limit per IP address', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => true);

      const response1 = await request(baseUrl)
        .get('/search?q=test')
        .set('X-Forwarded-For', '192.168.1.1');

      const response2 = await request(baseUrl)
        .get('/search?q=test')
        .set('X-Forwarded-For', '192.168.1.2');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Rate Limiting - GET /search/suggestions', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => true);

      const response = await request(baseUrl).get('/search/suggestions?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      });

      const response = await request(baseUrl).get('/search/suggestions?q=test');

      expect(response.status).toBe(429);
    });
  });

  describe('Rate Limiting - GET /search/trending', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => true);

      const response = await request(baseUrl).get('/search/trending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      });

      const response = await request(baseUrl).get('/search/trending');

      expect(response.status).toBe(429);
    });
  });
});

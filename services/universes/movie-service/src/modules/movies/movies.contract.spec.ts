import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  NotFoundException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { MoviesModule } from './movies.module.js';
import { MoviesService } from './movies.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    // Accept either x-user-id header or Authorization header
    if (req.headers['x-user-id'] || req.headers.authorization) {
      req.user = {
        sub: req.headers['x-user-id'] || 'user-123',
        role: req.headers['x-user-role'] || 'user',
        email: req.headers['x-user-email'] || 'user@example.com',
      };
      return true;
    }
    throw new UnauthorizedException();
  }
}

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  RateLimit: () => () => undefined,
  ServiceAuthGuard: jest.fn().mockImplementation(() => new MockAuthGuard()),
  AdminGuard: jest.fn().mockImplementation(() => new MockAuthGuard()),
}));

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => MockAuthGuard),
}));

jest.mock('@azeebo/shared-services', () => {
  const MockModule = {
    module: jest.fn().mockReturnValue({
      providers: [],
      exports: [],
    }),
  };
  return {
    CacheService: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      delete: jest.fn().mockResolvedValue(1),
      invalidate: jest.fn().mockResolvedValue(1),
    })),
    cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
    RedisModule: MockModule,
    JwtConfigModule: MockModule,
    RolesGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
    Roles: () => (_target: unknown, _propertyKey?: string, descriptor?: PropertyDescriptor) =>
      descriptor,
  };
});

describe('Movies Controller Contract Tests', () => {
  let app: INestApplication;

  const mockMoviesService = {
    listMovies: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getMovie: jest.fn().mockResolvedValue({ success: true, data: {} }),
    rentMovie: jest.fn().mockResolvedValue({ success: true, data: {} }),
    listPremieres: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getWatchlist: jest.fn().mockResolvedValue({ success: true, data: [] }),
    addToWatchlist: jest.fn().mockResolvedValue({ success: true, data: {} }),
    removeFromWatchlist: jest.fn().mockResolvedValue({ success: true, data: {} }),
    rateMovie: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getRecommendations: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getLibrary: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getViewingWindows: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getActiveViewingWindows: jest.fn().mockResolvedValue({ success: true, data: [] }),
    checkMovieAvailability: jest.fn().mockResolvedValue({ success: true, data: {} }),
    createViewingWindow: jest.fn().mockResolvedValue({ success: true, data: {} }),
    updateViewingWindow: jest.fn().mockResolvedValue({ success: true, data: {} }),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MoviesModule],
      providers: [{ provide: APP_GUARD, useClass: MockAuthGuard }],
    })
      .overrideProvider(MoviesService)
      .useValue(mockMoviesService)
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('test-value'),
        getOrThrow: jest.fn().mockReturnValue('test-value'),
      })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/movies (GET)', () => {
    it('should return movie catalog', () => {
      mockMoviesService.listMovies.mockResolvedValue({
        success: true,
        data: [{ id: 'movie-1', title: 'Action Movie' }],
      });

      return request(app.getHttpServer())
        .get('/movies')
        .set('x-user-id', 'user-123')
        .set('x-user-id', 'user-123')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data) || res.body.data.items).toBe(true);
        });
    });
  });

  describe('/movies/:movieId (GET)', () => {
    it('should return movie detail', () => {
      mockMoviesService.getMovie.mockResolvedValue({
        success: true,
        data: { id: 'movie-1', title: 'Action Movie', description: 'An action film' },
      });

      return request(app.getHttpServer())
        .get('/movies/movie-1')
        .set('x-user-id', 'user-123')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe('movie-1');
        });
    });

    it('should return error for non-existent movie', () => {
      mockMoviesService.getMovie.mockRejectedValue(new NotFoundException('Movie not found'));

      return request(app.getHttpServer())
        .get('/movies/nonexistent')
        .set('x-user-id', 'user-123')
        .expect(404);
    });
  });

  describe('/movies/:movieId/rent (POST)', () => {
    it('should rent a movie', () => {
      mockMoviesService.rentMovie.mockResolvedValue({
        success: true,
        data: { rentalId: 'rental-1', expiresAt: '2024-12-31' },
      });

      return request(app.getHttpServer())
        .post('/movies/movie-1/rent')
        .set('Authorization', 'Bearer valid-token')
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer()).post('/movies/movie-1/rent').expect(401);
    });
  });

  describe('/movies/premieres (GET)', () => {
    it('should return premiere movies', () => {
      mockMoviesService.listPremieres.mockResolvedValue({
        success: true,
        data: [{ id: 'premiere-1', title: 'New Release' }],
      });

      return request(app.getHttpServer())
        .get('/movies/premieres')
        .set('x-user-id', 'user-123')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/movies/watchlist (GET)', () => {
    it('should return user watchlist', () => {
      mockMoviesService.getWatchlist.mockResolvedValue({
        success: true,
        data: [{ id: 'movie-1', title: 'Watchlisted Movie' }],
      });

      return request(app.getHttpServer())
        .get('/movies/watchlist')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer()).get('/movies/watchlist').expect(401);
    });
  });

  describe('/movies/watchlist (POST)', () => {
    it('should add movie to watchlist', () => {
      mockMoviesService.addToWatchlist.mockResolvedValue({
        success: true,
        data: { watchlistId: 'wl-1', movieId: 'movie-1' },
      });

      return request(app.getHttpServer())
        .post('/movies/watchlist')
        .set('Authorization', 'Bearer valid-token')
        .send({ movieId: 'movie-1' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockMoviesService.listMovies.mockResolvedValue({
        success: true,
        data: [],
      });

      return request(app.getHttpServer())
        .get('/movies')
        .set('x-user-id', 'user-123')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('pagination metadata', () => {
    it('should include pagination in list responses', () => {
      mockMoviesService.listMovies.mockResolvedValue({
        success: true,
        data: { items: [], page: 1, limit: 20, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/movies')
        .set('x-user-id', 'user-123')
        .expect((res) => {
          if (res.body.data && typeof res.body.data === 'object') {
            expect(res.body.data).toHaveProperty('page');
            expect(res.body.data).toHaveProperty('limit');
          }
        });
    });
  });

  describe('error responses', () => {
    it('should return 401 for protected endpoints without token', () => {
      return request(app.getHttpServer()).post('/movies/movie-1/rent').expect(401);
    });
  });
});

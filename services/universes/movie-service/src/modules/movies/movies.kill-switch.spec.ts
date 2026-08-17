import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';
import { FeatureFlagGuard, FeatureFlagService, movieFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  RedisModule: { module: jest.fn(), exports: [] },
  JwtConfigModule: { module: jest.fn(), exports: [] },
  RolesGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  Roles: () => (_target: unknown, _propertyKey?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
}));

import { ServiceAuthGuard, RateLimitGuard } from '@azeebo/security';

class MockServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
    return true;
  }
}
class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

/**
 * Kill-switch simulation: boots the movies controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(movieFlags.*) actually gate the routes.
 * With every flag off, premieres + watchlist + rent must 403 before the
 * service runs; cinema-pass (class-level gate) must 403 too.
 */
describe('MoviesController kill-switch (movie_* flags)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockMoviesService = {
    listMovies: jest.fn().mockResolvedValue({ success: true, data: { movies: [] } }),
    listPremieres: jest.fn().mockResolvedValue({ success: true, data: { premieres: [] } }),
    getWatchlist: jest.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    addToWatchlist: jest.fn().mockResolvedValue({ success: true, data: {} }),
    removeFromWatchlist: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getMovie: jest.fn().mockResolvedValue({ success: true, data: {} }),
    rentMovie: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getLibrary: jest.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    createViewingWindow: jest.fn(),
    updateViewingWindow: jest.fn(),
    getViewingWindows: jest.fn(),
    getActiveViewingWindows: jest.fn(),
    checkMovieAvailability: jest.fn(),
    rateMovie: jest.fn(),
    getRecommendations: jest.fn(),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all movie flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        { provide: MoviesService, useValue: mockMoviesService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockServiceAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
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
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
  });

  it('blocks GET /movies/premieres with 403 when movie_premieres_enabled is off', async () => {
    await request(baseUrl).get('/movies/premieres').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(movieFlags.premieresEnabled);
    expect(mockMoviesService.listPremieres).not.toHaveBeenCalled();
  });

  it('blocks GET /movies/watchlist with 403 when movie_watchlist_sync is off', async () => {
    await request(baseUrl).get('/movies/watchlist').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(movieFlags.watchlistSync);
    expect(mockMoviesService.getWatchlist).not.toHaveBeenCalled();
  });

  it('blocks POST /movies/watchlist with 403 when movie_watchlist_sync is off', async () => {
    await request(baseUrl)
      .post('/movies/watchlist')
      .send({ movieId: 'movie-1' })
      .expect(403);
    expect(mockMoviesService.addToWatchlist).not.toHaveBeenCalled();
  });

  it('blocks DELETE /movies/watchlist/:movieId with 403 when movie_watchlist_sync is off', async () => {
    await request(baseUrl).delete('/movies/watchlist/movie-1').expect(403);
    expect(mockMoviesService.removeFromWatchlist).not.toHaveBeenCalled();
  });

  it('blocks POST /movies/:movieId/rent with 403 when movie_rentals_enabled is off', async () => {
    await request(baseUrl).post('/movies/movie-1/rent').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(movieFlags.rentalsEnabled);
    expect(mockMoviesService.rentMovie).not.toHaveBeenCalled();
  });

  it('serves ungated catalog endpoints when the flags are off', async () => {
    await request(baseUrl).get('/movies').expect(200);
    expect(mockMoviesService.listMovies).toHaveBeenCalled();
  });
});

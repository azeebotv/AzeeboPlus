import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MoviesService } from './movies.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
    invalidate: jest.fn().mockResolvedValue(1),
  })),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

describe('MoviesService Integration - Cross-Service Communication', () => {
  let service: MoviesService;

  const mockPrismaService = {
    movie: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    watchlistItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    premiere: {
      findMany: jest.fn(),
    },
    viewingWindow: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
    invalidate: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    // Reset cache mock to return null by default
    mockCacheService.get.mockReset();
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockReset();
    mockCacheService.set.mockResolvedValue('OK');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                MOVIE_RENTAL_FEE: 500,
                ANALYTICS_SERVICE_URL: 'http://analytics-service:3008',
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                WALLET_SERVICE_URL: 'http://wallet-service:3030',
              };
              return config[key];
            }),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);

    jest.clearAllMocks();
  });

  describe('listMovies - Movie Catalog', () => {
    it('should return list of movies', async () => {
      const mockMovies = [
        {
          id: 'movie-1',
          title: 'The Comedy Special',
          description: 'A hilarious stand-up special',
          thumbnail: 'https://example.com/thumb.jpg',
          mediaUrl: 'https://example.com/video.mp4',
          duration: 7200,
          status: 'published',
          viewCount: 1500,
          createdAt: new Date(),
          viewingWindows: [],
          _count: { rentals: 25 },
        },
      ];

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);

      const result = await service.listMovies();

      expect(result.success).toBe(true);
      expect(mockPrismaService.movie.findMany).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const cachedMovies = { movies: [{ id: 'movie-1', title: 'Cached Movie' }] };
      mockCacheService.get.mockResolvedValue(cachedMovies);

      const result = await service.listMovies();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedMovies);
      expect(mockPrismaService.movie.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getMovie - Movie Detail', () => {
    it('should return movie by id', async () => {
      const mockMovie = {
        id: 'movie-1',
        title: 'The Comedy Special',
        description: 'A hilarious stand-up special',
        thumbnail: 'https://example.com/thumb.jpg',
        mediaUrl: 'https://example.com/video.mp4',
        duration: 7200,
        status: 'published',
        viewCount: 1500,
        createdAt: new Date(),
        viewingWindows: [],
      };

      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);

      const result = await service.getMovie('movie-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'movie-1' },
        })
      );
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      await expect(service.getMovie('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rentMovie - Wallet Service Integration', () => {
    it('should successfully rent a movie with wallet debit', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        title: 'The Comedy Special',
      });

      mockedAxios.get.mockResolvedValue({
        data: { data: { id: 'wallet-1', balance: 1000 } },
      });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      mockPrismaService.rental.create.mockResolvedValue({
        id: 'rental-1',
        userId: 'user-1',
        movieId: 'movie-1',
        status: 'active',
      });

      const result = await service.rentMovie('user-1', 'movie-1');

      expect(result.success).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/user/user-1'),
        expect.objectContaining({ timeout: 10000 })
      );
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/debit'),
        expect.objectContaining({
          amount: 500,
          description: expect.stringContaining('The Comedy Special'),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw BadRequestException when movie already rented', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue({
        id: 'rental-existing',
        userId: 'user-1',
        movieId: 'movie-1',
      });

      await expect(service.rentMovie('user-1', 'movie-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      await expect(service.rentMovie('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when wallet does not exist', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        title: 'The Comedy Special',
      });

      mockedAxios.get.mockResolvedValue({ data: { data: null } });

      await expect(service.rentMovie('user-1', 'movie-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient wallet balance', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        title: 'The Comedy Special',
      });

      mockedAxios.get.mockResolvedValue({
        data: { data: { id: 'wallet-1', balance: 100 } },
      });

      await expect(service.rentMovie('user-1', 'movie-1')).rejects.toThrow(BadRequestException);
    });

    it('should compensate wallet when rental creation fails after debit', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        title: 'The Comedy Special',
      });

      mockedAxios.get.mockResolvedValue({
        data: { data: { id: 'wallet-1', balance: 1000 } },
      });

      mockedAxios.post
        .mockResolvedValueOnce({ data: { success: true } })
        .mockResolvedValueOnce({ data: { success: true } });

      mockPrismaService.rental.create.mockRejectedValue(new Error('Database error'));

      // A Prisma failure after the wallet debit is a server fault (the saga
      // compensates either way) — mapAndThrow maps it honestly to 500.
      await expect(service.rentMovie('user-1', 'movie-1')).rejects.toThrow(
        InternalServerErrorException
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/credit'),
        expect.objectContaining({
          description: expect.stringContaining('Compensation'),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });
  });

  describe('addToWatchlist - Watchlist Management', () => {
    it('should successfully add movie to watchlist', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValue(null);
      mockPrismaService.watchlistItem.create.mockResolvedValue({
        id: 'wl-1',
        userId: 'user-1',
        movieId: 'movie-1',
      });

      const result = await service.addToWatchlist('user-1', 'movie-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.watchlistItem.create).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/events'),
        expect.objectContaining({
          type: 'movie_watchlisted',
          userId: 'user-1',
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw BadRequestException when movie already in watchlist', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValue({
        id: 'wl-existing',
        userId: 'user-1',
        movieId: 'movie-1',
      });

      await expect(service.addToWatchlist('user-1', 'movie-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('removeFromWatchlist - Watchlist Management', () => {
    it('should successfully remove movie from watchlist', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValue({
        id: 'wl-1',
        userId: 'user-1',
        movieId: 'movie-1',
      });

      const result = await service.removeFromWatchlist('user-1', 'movie-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.watchlistItem.delete).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/events'),
        expect.objectContaining({
          type: 'movie_watchlist_removed',
          userId: 'user-1',
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw NotFoundException when item not in watchlist', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValue(null);

      await expect(service.removeFromWatchlist('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('Error Handling - Service Resilience', () => {
    it('should handle analytics service failure gracefully on watchlist add', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValue(null);
      mockPrismaService.watchlistItem.create.mockResolvedValue({
        id: 'wl-1',
        userId: 'user-1',
        movieId: 'movie-1',
      });

      mockedAxios.post.mockRejectedValue(new Error('Analytics service down'));

      const result = await service.addToWatchlist('user-1', 'movie-1');

      expect(result.success).toBe(true);
    });

    it('should handle wallet service failure during rental', async () => {
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        title: 'The Comedy Special',
      });

      mockedAxios.get.mockResolvedValue({
        data: { data: { id: 'wallet-1', balance: 1000 } },
      });

      mockedAxios.post.mockRejectedValue(new Error('Wallet service unavailable'));

      // An internal wallet-service outage is a server error, not a client error.
      await expect(service.rentMovie('user-1', 'movie-1')).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MoviesService', () => {
  let service: MoviesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: PrismaService,
          useValue: {
            movie: { findMany: jest.fn(), findUnique: jest.fn() },
            rental: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
            watchlistItem: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            viewingWindow: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
            premiere: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listMovies', () => {
    it('should return list of movies (happy path)', async () => {
      const mockMovies = [
        { id: 'movie-1', title: 'Movie 1', createdAt: new Date() },
        { id: 'movie-2', title: 'Movie 2', createdAt: new Date() },
      ];
      (prismaService.movie.findMany as jest.Mock).mockResolvedValue(mockMovies);

      const result = await service.listMovies();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovies);
      expect(prismaService.movie.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no movies exist', async () => {
      (prismaService.movie.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listMovies();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getMovie', () => {
    const movieId = 'movie-1';

    it('should return movie details (happy path)', async () => {
      const mockMovie = { id: movieId, title: 'Movie 1' };
      (prismaService.movie.findUnique as jest.Mock).mockResolvedValue(mockMovie);

      const result = await service.getMovie(movieId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovie);
    });

    it('should throw NotFoundException when movie not found', async () => {
      (prismaService.movie.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMovie(movieId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rentMovie', () => {
    const userId = 'user-123';
    const movieId = 'movie-1';

    it('should rent movie successfully (happy path)', async () => {
      const mockRental = { id: 'rental-1', userId, movieId, status: 'active' };
      (prismaService.rental.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.rental.create as jest.Mock).mockResolvedValue(mockRental);

      const result = await service.rentMovie(userId, movieId);

      expect(result.success).toBe(true);
      expect(result.data?.rentalId).toBe('rental-1');
      expect(result.data?.message).toBe('Movie rented successfully');
    });

    it('should throw BadRequestException when movie already rented', async () => {
      const mockExistingRental = { id: 'rental-1', userId, movieId, status: 'active' };
      (prismaService.rental.findUnique as jest.Mock).mockResolvedValue(mockExistingRental);

      await expect(service.rentMovie(userId, movieId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addToWatchlist', () => {
    const userId = 'user-123';
    const movieId = 'movie-1';

    it('should add movie to watchlist (happy path)', async () => {
      const mockItem = { id: 'watchlist-1', userId, movieId };
      (prismaService.watchlistItem.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.watchlistItem.create as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.addToWatchlist(userId, movieId);

      expect(result.success).toBe(true);
      expect(result.data?.watchlistItemId).toBe('watchlist-1');
    });

    it('should throw BadRequestException when movie already in watchlist', async () => {
      const mockExistingItem = { id: 'watchlist-1', userId, movieId };
      (prismaService.watchlistItem.findUnique as jest.Mock).mockResolvedValue(mockExistingItem);

      await expect(service.addToWatchlist(userId, movieId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFromWatchlist', () => {
    const userId = 'user-123';
    const movieId = 'movie-1';

    it('should remove movie from watchlist (happy path)', async () => {
      const mockItem = { id: 'watchlist-1', userId, movieId };
      (prismaService.watchlistItem.findUnique as jest.Mock).mockResolvedValue(mockItem);
      (prismaService.watchlistItem.delete as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.removeFromWatchlist(userId, movieId);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Removed from watchlist');
    });

    it('should throw NotFoundException when item not in watchlist', async () => {
      (prismaService.watchlistItem.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.removeFromWatchlist(userId, movieId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkMovieAvailability', () => {
    const movieId = 'movie-1';

    it('should return available when active viewing window exists', async () => {
      const mockWindow = { id: 'window-1', movieId, isActive: true };
      (prismaService.viewingWindow.findFirst as jest.Mock).mockResolvedValue(mockWindow);

      const result = await service.checkMovieAvailability(movieId);

      expect(result.success).toBe(true);
      expect(result.data?.available).toBe(true);
      expect(result.data?.viewingWindow).toEqual(mockWindow);
    });

    it('should return unavailable when no active viewing window', async () => {
      (prismaService.viewingWindow.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.checkMovieAvailability(movieId);

      expect(result.success).toBe(true);
      expect(result.data?.available).toBe(false);
    });
  });

  describe('createViewingWindow', () => {
    const movieId = 'movie-1';

    it('should create viewing window (happy path)', async () => {
      const mockMovie = { id: movieId, title: 'Movie 1' };
      const mockWindow = { id: 'window-1', movieId, isActive: true };
      const windowData = { startsAt: new Date(), type: 'premiere' };

      (prismaService.movie.findUnique as jest.Mock).mockResolvedValue(mockMovie);
      (prismaService.viewingWindow.create as jest.Mock).mockResolvedValue(mockWindow);

      const result = await service.createViewingWindow(movieId, windowData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWindow);
    });

    it('should throw NotFoundException when movie not found', async () => {
      (prismaService.movie.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createViewingWindow(movieId, { startsAt: new Date(), type: 'premiere' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateViewingWindow', () => {
    const windowId = 'window-1';

    it('should update viewing window (happy path)', async () => {
      const mockWindow = { id: windowId, isActive: true };
      const updatedWindow = { id: windowId, isActive: false };

      (prismaService.viewingWindow.findUnique as jest.Mock).mockResolvedValue(mockWindow);
      (prismaService.viewingWindow.update as jest.Mock).mockResolvedValue(updatedWindow);

      const result = await service.updateViewingWindow(windowId, { isActive: false });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedWindow);
    });

    it('should throw NotFoundException when window not found', async () => {
      (prismaService.viewingWindow.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateViewingWindow(windowId, { isActive: false })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getLibrary', () => {
    const userId = 'user-123';

    it('should return user library with active rentals', async () => {
      const mockRentals = [{ id: 'rental-1', userId, movieId: 'movie-1', status: 'active' }];
      (prismaService.rental.findMany as jest.Mock).mockResolvedValue(mockRentals);

      const result = await service.getLibrary(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRentals);
    });
  });

  describe('getWatchlist', () => {
    const userId = 'user-123';

    it('should return user watchlist', async () => {
      const mockWatchlist = [{ id: 'watchlist-1', userId, movieId: 'movie-1' }];
      (prismaService.watchlistItem.findMany as jest.Mock).mockResolvedValue(mockWatchlist);

      const result = await service.getWatchlist(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWatchlist);
    });
  });
});

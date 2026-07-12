import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';
import { RateLimitService } from '@azeebo/security';

describe('MoviesController', () => {
  let controller: MoviesController;

  const mockMoviesService = {
    listMovies: jest.fn(),
    listPremieres: jest.fn(),
    getWatchlist: jest.fn(),
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
    getMovie: jest.fn(),
    rentMovie: jest.fn(),
    getLibrary: jest.fn(),
    createViewingWindow: jest.fn(),
    updateViewingWindow: jest.fn(),
    getViewingWindows: jest.fn(),
    getActiveViewingWindows: jest.fn(),
    checkMovieAvailability: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000, limit: 10 }),
    resetRateLimit: jest.fn(),
    getRateLimitStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listMovies', () => {
    it('should return movie catalog', async () => {
      const result = { success: true, data: { movies: [] } };
      mockMoviesService.listMovies.mockResolvedValue(result);

      expect(await controller.listMovies()).toEqual(result);
      expect(mockMoviesService.listMovies).toHaveBeenCalled();
    });
  });

  describe('listPremieres', () => {
    it('should return premieres list', async () => {
      const result = { success: true, data: { premieres: [] } };
      mockMoviesService.listPremieres.mockResolvedValue(result);

      expect(await controller.listPremieres()).toEqual(result);
      expect(mockMoviesService.listPremieres).toHaveBeenCalled();
    });
  });

  describe('getWatchlist', () => {
    it('should return user watchlist', async () => {
      const req = { user: { id: 'user-123' } };
      const result = { success: true, data: { watchlist: [] } };
      mockMoviesService.getWatchlist.mockResolvedValue(result);

      expect(await controller.getWatchlist(req)).toEqual(result);
      expect(mockMoviesService.getWatchlist).toHaveBeenCalledWith('user-123');
    });
  });

  describe('addToWatchlist', () => {
    it('should add movie to watchlist', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { movieId: 'movie-1' };
      const result = {
        success: true,
        data: { watchlistItemId: 'item-1', message: 'Added to watchlist' },
      };
      mockMoviesService.addToWatchlist.mockResolvedValue(result);

      expect(await controller.addToWatchlist(req, body)).toEqual(result);
      expect(mockMoviesService.addToWatchlist).toHaveBeenCalledWith('user-123', 'movie-1');
    });

    it('should throw BadRequestException when movie already in watchlist', async () => {
      const req = { user: { id: 'user-123' } };
      const body = { movieId: 'movie-1' };
      mockMoviesService.addToWatchlist.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Movie already in watchlist')
      );

      await expect(controller.addToWatchlist(req, body)).rejects.toThrow(
        'Movie already in watchlist'
      );
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove movie from watchlist', async () => {
      const req = { user: { id: 'user-123' } };
      const result = { success: true, data: { message: 'Removed from watchlist' } };
      mockMoviesService.removeFromWatchlist.mockResolvedValue(result);

      expect(await controller.removeFromWatchlist(req, 'movie-1')).toEqual(result);
      expect(mockMoviesService.removeFromWatchlist).toHaveBeenCalledWith('user-123', 'movie-1');
    });

    it('should throw NotFoundException when item not in watchlist', async () => {
      const req = { user: { id: 'user-123' } };
      mockMoviesService.removeFromWatchlist.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Item not in watchlist')
      );

      await expect(controller.removeFromWatchlist(req, 'nonexistent')).rejects.toThrow(
        'Item not in watchlist'
      );
    });
  });

  describe('getMovie', () => {
    it('should return movie detail', async () => {
      const result = { success: true, data: { id: 'movie-1', title: 'Test Movie' } };
      mockMoviesService.getMovie.mockResolvedValue(result);

      expect(await controller.getMovie('movie-1')).toEqual(result);
      expect(mockMoviesService.getMovie).toHaveBeenCalledWith('movie-1');
    });

    it('should throw NotFoundException when movie not found', async () => {
      mockMoviesService.getMovie.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Movie not found')
      );

      await expect(controller.getMovie('nonexistent')).rejects.toThrow('Movie not found');
    });
  });

  describe('rentMovie', () => {
    it('should rent a movie', async () => {
      const req = { user: { id: 'user-123' } };
      const result = {
        success: true,
        data: { rentalId: 'rental-1', fee: 500, message: 'Movie rented successfully' },
      };
      mockMoviesService.rentMovie.mockResolvedValue(result);

      expect(await controller.rentMovie(req, 'movie-1')).toEqual(result);
      expect(mockMoviesService.rentMovie).toHaveBeenCalledWith('user-123', 'movie-1');
    });

    it('should throw BadRequestException when movie already rented', async () => {
      const req = { user: { id: 'user-123' } };
      mockMoviesService.rentMovie.mockRejectedValue(
        new (require('@nestjs/common').BadRequestException)('Movie already rented')
      );

      await expect(controller.rentMovie(req, 'movie-1')).rejects.toThrow('Movie already rented');
    });

    it('should throw NotFoundException when movie not found', async () => {
      const req = { user: { id: 'user-123' } };
      mockMoviesService.rentMovie.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Movie not found')
      );

      await expect(controller.rentMovie(req, 'nonexistent')).rejects.toThrow('Movie not found');
    });
  });

  describe('getLibrary', () => {
    it('should return user library', async () => {
      const req = { user: { id: 'user-123' } };
      const result = { success: true, data: { rentals: [] } };
      mockMoviesService.getLibrary.mockResolvedValue(result);

      expect(await controller.getLibrary(req)).toEqual(result);
      expect(mockMoviesService.getLibrary).toHaveBeenCalledWith('user-123');
    });
  });

  describe('createViewingWindow', () => {
    it('should create a viewing window', async () => {
      const body = { startsAt: new Date('2026-01-01'), type: 'premiere' };
      const result = { success: true, data: { id: 'window-1' } };
      mockMoviesService.createViewingWindow.mockResolvedValue(result);

      expect(await controller.createViewingWindow('movie-1', body)).toEqual(result);
      expect(mockMoviesService.createViewingWindow).toHaveBeenCalledWith('movie-1', body);
    });

    it('should throw NotFoundException when movie not found', async () => {
      const body = { startsAt: new Date('2026-01-01'), type: 'premiere' };
      mockMoviesService.createViewingWindow.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Movie not found')
      );

      await expect(controller.createViewingWindow('nonexistent', body)).rejects.toThrow(
        'Movie not found'
      );
    });
  });

  describe('updateViewingWindow', () => {
    it('should update a viewing window', async () => {
      const body = { isActive: false };
      const result = { success: true, data: { id: 'window-1', isActive: false } };
      mockMoviesService.updateViewingWindow.mockResolvedValue(result);

      expect(await controller.updateViewingWindow('window-1', body)).toEqual(result);
      expect(mockMoviesService.updateViewingWindow).toHaveBeenCalledWith('window-1', body);
    });

    it('should throw NotFoundException when viewing window not found', async () => {
      mockMoviesService.updateViewingWindow.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Viewing window not found')
      );

      await expect(controller.updateViewingWindow('nonexistent', {})).rejects.toThrow(
        'Viewing window not found'
      );
    });
  });

  describe('getViewingWindows', () => {
    it('should return movie viewing windows', async () => {
      const result = { success: true, data: { windows: [] } };
      mockMoviesService.getViewingWindows.mockResolvedValue(result);

      expect(await controller.getViewingWindows('movie-1')).toEqual(result);
      expect(mockMoviesService.getViewingWindows).toHaveBeenCalledWith('movie-1');
    });
  });

  describe('getActiveViewingWindows', () => {
    it('should return active viewing windows', async () => {
      const result = { success: true, data: { windows: [] } };
      mockMoviesService.getActiveViewingWindows.mockResolvedValue(result);

      expect(await controller.getActiveViewingWindows()).toEqual(result);
      expect(mockMoviesService.getActiveViewingWindows).toHaveBeenCalled();
    });
  });

  describe('checkMovieAvailability', () => {
    it('should check movie availability', async () => {
      const result = { success: true, data: { available: true, viewingWindow: null } };
      mockMoviesService.checkMovieAvailability.mockResolvedValue(result);

      expect(await controller.checkMovieAvailability('movie-1')).toEqual(result);
      expect(mockMoviesService.checkMovieAvailability).toHaveBeenCalledWith('movie-1');
    });
  });
});

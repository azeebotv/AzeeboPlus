import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('GenreService', () => {
  let service: GenreService;
  let prisma: {
    genre: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    movie: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      genre: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      movie: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GenreService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<GenreService>(GenreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listGenres', () => {
    it('should return all active genres', async () => {
      const mockGenres = [
        { id: '1', name: 'African', slug: 'african', isActive: true },
        { id: '2', name: 'Hollywood', slug: 'hollywood', isActive: true },
      ];
      prisma.genre.findMany.mockResolvedValue(mockGenres);

      const result = await service.listGenres({ activeOnly: true });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGenres);
    });

    it('should return empty array when no genres exist', async () => {
      prisma.genre.findMany.mockResolvedValue([]);

      const result = await service.listGenres();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getGenreById', () => {
    it('should return genre by id', async () => {
      const mockGenre = { id: '1', name: 'African', slug: 'african' };
      prisma.genre.findUnique.mockResolvedValue(mockGenre);

      const result = await service.getGenreById('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGenre);
    });

    it('should throw NotFoundException when genre not found', async () => {
      prisma.genre.findUnique.mockResolvedValue(null);

      await expect(service.getGenreById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGenreBySlug', () => {
    it('should return genre by slug', async () => {
      const mockGenre = { id: '1', name: 'African', slug: 'african' };
      prisma.genre.findUnique.mockResolvedValue(mockGenre);

      const result = await service.getGenreBySlug('african');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGenre);
    });

    it('should throw NotFoundException when slug not found', async () => {
      prisma.genre.findUnique.mockResolvedValue(null);

      await expect(service.getGenreBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGenre', () => {
    it('should create a new genre', async () => {
      const createData = { name: 'African', description: 'African cinema' };
      const mockGenre = {
        id: '1',
        name: 'African',
        slug: 'african',
        description: 'African cinema',
      };

      prisma.genre.findFirst.mockResolvedValue(null);
      prisma.genre.create.mockResolvedValue(mockGenre);

      const result = await service.createGenre(createData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGenre);
    });

    it('should throw ConflictException for duplicate name', async () => {
      const createData = { name: 'African', description: 'African cinema' };
      prisma.genre.findFirst.mockResolvedValue({ id: '1', name: 'African' });

      await expect(service.createGenre(createData)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateGenre', () => {
    it('should update an existing genre', async () => {
      const mockGenre = { id: '1', name: 'African', slug: 'african' };
      const updatedGenre = { id: '1', name: 'African Cinema', slug: 'african' };

      prisma.genre.findUnique.mockResolvedValue(mockGenre);
      prisma.genre.findFirst.mockResolvedValue(null);
      prisma.genre.update.mockResolvedValue(updatedGenre);

      const result = await service.updateGenre('1', { name: 'African Cinema' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedGenre);
    });

    it('should throw NotFoundException when genre not found', async () => {
      prisma.genre.findUnique.mockResolvedValue(null);

      await expect(service.updateGenre('999', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGenre', () => {
    it('should delete an empty genre', async () => {
      const mockGenre = { id: '1', name: 'Documentary', _count: { movies: 0 } };
      prisma.genre.findUnique.mockResolvedValue(mockGenre);
      prisma.genre.delete.mockResolvedValue({});

      const result = await service.deleteGenre('1');

      expect(result.success).toBe(true);
    });

    it('should throw ConflictException when genre has movies', async () => {
      const mockGenre = { id: '1', name: 'African', _count: { movies: 5 } };
      prisma.genre.findUnique.mockResolvedValue(mockGenre);

      await expect(service.deleteGenre('1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when genre not found', async () => {
      prisma.genre.findUnique.mockResolvedValue(null);

      await expect(service.deleteGenre('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMoviesByGenre', () => {
    it('should return movies for a genre', async () => {
      const mockMovies = [
        { id: '1', title: 'Lion King', genreId: '1' },
        { id: '2', title: 'Black Panther', genreId: '1' },
      ];
      prisma.movie.findMany.mockResolvedValue(mockMovies);
      prisma.movie.count.mockResolvedValue(2);

      const result = await service.getMoviesByGenre('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMovies);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });

    it('should support pagination', async () => {
      prisma.movie.findMany.mockResolvedValue([]);
      prisma.movie.count.mockResolvedValue(50);

      const result = await service.getMoviesByGenre('1', { page: 2, limit: 10 });

      expect(result.meta).toEqual({ page: 2, limit: 10, total: 50, totalPages: 5 });
    });
  });
});

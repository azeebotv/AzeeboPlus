import { Test, TestingModule } from '@nestjs/testing';
import { MusicService } from './music.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MusicService', () => {
  let service: MusicService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockMusicEntry = {
    id: 'music-1',
    title: 'Test Song',
    slug: 'test-song',
    type: 'single',
    description: 'Test description',
    coverImage: 'https://example.com/cover.jpg',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    duration: 240,
    genre: 'pop',
    trackUrl: 'https://example.com/track.mp3',
    isPremium: false,
    playCount: 1000,
    status: 'published',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    createdById: 'user-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        {
          provide: PrismaService,
          useValue: {
            musicEntry: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MusicService>(MusicService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return paginated music entries', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([mockMusicEntry]);
      (prismaService.musicEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by type', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([mockMusicEntry]);
      (prismaService.musicEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, 'single');

      expect((prismaService.musicEntry.findMany as jest.Mock).mock.calls[0][0].where.type).toBe(
        'single'
      );
    });

    it('should filter by genre', async () => {
      (prismaService.musicEntry.findMany as jest.Mock)
        .mockResolvedValueOnce([{ genre: 'pop' }]) // resolver probe
        .mockResolvedValue([mockMusicEntry]);
      (prismaService.musicEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, 'pop');

      expect((prismaService.musicEntry.findMany as jest.Mock).mock.calls[1][0].where.genre).toBe(
        'pop'
      );
    });

    it('should resolve a genre slug to the stored genre value', async () => {
      (prismaService.musicEntry.findMany as jest.Mock)
        .mockResolvedValueOnce([{ genre: 'Afrobeats' }]) // resolver probe
        .mockResolvedValue([mockMusicEntry]);
      (prismaService.musicEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, 'afrobeats');

      expect((prismaService.musicEntry.findMany as jest.Mock).mock.calls[1][0].where.genre).toBe(
        'Afrobeats'
      );
    });

    it('should resolve artistId slug to the stored artistName', async () => {
      (prismaService.musicEntry.findMany as jest.Mock)
        .mockResolvedValueOnce([{ artistName: 'Tiwa Sunset' }]) // resolver probe
        .mockResolvedValue([mockMusicEntry]);
      (prismaService.musicEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, undefined, 'tiwa-sunset');

      expect(
        (prismaService.musicEntry.findMany as jest.Mock).mock.calls[1][0].where.artistName
      ).toBe('Tiwa Sunset');
    });

    it('should return an empty page for an unknown artistId without querying entries', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([
        { artistName: 'Tiwa Sunset' },
      ]);

      const result = await service.getEntries(1, 20, undefined, undefined, 'ghost');

      expect(result.success).toBe(true);
      const data = result.data as { items: unknown[]; total: number };
      expect(data.items).toEqual([]);
      expect(data.total).toBe(0);
      expect(prismaService.musicEntry.count).not.toHaveBeenCalled();
    });
  });

  describe('getEntryBySlug', () => {
    it('should return music entry', async () => {
      (prismaService.musicEntry.findUnique as jest.Mock).mockResolvedValue(mockMusicEntry);
      (prismaService.musicEntry.update as jest.Mock).mockResolvedValue(mockMusicEntry);

      const result = await service.getEntryBySlug('test-song');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Test Song');
    });

    it('should throw NotFoundException if music not found', async () => {
      (prismaService.musicEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEntryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGenreDetail', () => {
    it('should resolve case/slug variants to the stored genre value', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([{ genre: 'Afrobeats' }]);
      (prismaService.musicEntry.aggregate as jest.Mock).mockResolvedValue({
        _count: 2,
        _sum: { duration: 422, playCount: 160300 },
      });
      (prismaService.musicEntry.findMany as jest.Mock)
        .mockResolvedValueOnce([{ genre: 'Afrobeats' }])
        .mockResolvedValueOnce([mockMusicEntry]);

      const result = await service.getGenreDetail('afrobeats');

      expect(result.success).toBe(true);
      const detail = result.data as Record<string, unknown>;
      expect(detail.name).toBe('Afrobeats');
      expect(detail.slug).toBe('afrobeats');
      expect(detail.trackCount).toBe(2);
      expect(detail.totalPlays).toBe(160300);
      expect(Array.isArray(detail.featured)).toBe(true);
    });

    it('should throw NotFoundException for unknown genres', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([{ genre: 'Afrobeats' }]);

      await expect(service.getGenreDetail('jazz')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getArtistDetail', () => {
    it('should derive artist profile from their entries', async () => {
      (prismaService.musicEntry.findMany as jest.Mock)
        .mockResolvedValueOnce([{ artistName: 'Tiwa Sunset' }])
        .mockResolvedValueOnce([
          { ...mockMusicEntry, artistName: 'Tiwa Sunset', genre: 'Afrobeats', playCount: 84200 },
          { ...mockMusicEntry, artistName: 'Tiwa Sunset', genre: 'Afrobeats', playCount: 76100 },
        ]);

      const result = await service.getArtistDetail('tiwa-sunset');

      expect(result.success).toBe(true);
      const detail = result.data as Record<string, unknown>;
      expect(detail.name).toBe('Tiwa Sunset');
      expect(detail.id).toBe('tiwa-sunset');
      expect(detail.trackCount).toBe(2);
      expect(detail.genre).toBe('Afrobeats');
    });

    it('should throw NotFoundException for unknown artists', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([
        { artistName: 'Tiwa Sunset' },
      ]);

      await expect(service.getArtistDetail('nobody')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGenres', () => {
    it('should return genres', async () => {
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([mockMusicEntry]);

      const result = await service.getGenres();

      expect(result.genres).toContain('pop');
    });
  });

  describe('createEntry', () => {
    it('should create music entry successfully', async () => {
      (prismaService.musicEntry.create as jest.Mock).mockResolvedValue(mockMusicEntry);

      const result = await service.createEntry({
        title: 'Test Song',
        type: 'single',
        artistName: 'Test Artist',
        genre: 'pop',
        createdById: 'user-123',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-song');
    });
  });

  describe('updateEntry', () => {
    it('should update music entry successfully', async () => {
      (prismaService.musicEntry.findUnique as jest.Mock).mockResolvedValue(mockMusicEntry);
      (prismaService.musicEntry.update as jest.Mock).mockResolvedValue({
        ...mockMusicEntry,
        title: 'Updated Song',
        slug: 'updated-song',
      });

      const result = await service.updateEntry('music-1', { title: 'Updated Song' });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Updated Song');
    });

    it('should throw NotFoundException if music not found', async () => {
      (prismaService.musicEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEntry('not-found', { title: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete music entry successfully', async () => {
      (prismaService.musicEntry.findUnique as jest.Mock).mockResolvedValue(mockMusicEntry);
      (prismaService.musicEntry.delete as jest.Mock).mockResolvedValue(mockMusicEntry);

      const result = await service.deleteEntry('music-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Entry deleted successfully');
    });

    it('should throw NotFoundException if music not found', async () => {
      (prismaService.musicEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEntry('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});

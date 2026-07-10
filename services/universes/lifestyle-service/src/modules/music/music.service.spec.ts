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
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([mockMusicEntry]);
      (prismaService.musicEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, 'pop');

      expect((prismaService.musicEntry.findMany as jest.Mock).mock.calls[0][0].where.genre).toBe(
        'pop'
      );
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

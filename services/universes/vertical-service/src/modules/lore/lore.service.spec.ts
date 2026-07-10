import { Test, TestingModule } from '@nestjs/testing';
import { LoreService } from './lore.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('LoreService', () => {
  let service: LoreService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUniverse = {
    id: 'universe-1',
    name: 'Test Universe',
    slug: 'test-universe',
  };

  const mockLoreEntry = {
    id: 'lore-1',
    title: 'Test Lore',
    slug: 'test-lore',
    category: 'history',
    content: 'Test content',
    excerpt: 'Test excerpt',
    coverImage: 'https://example.com/cover.jpg',
    importance: 'high',
    universeId: 'universe-1',
    universe: mockUniverse,
    viewCount: 100,
    status: 'published',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoreService,
        {
          provide: PrismaService,
          useValue: {
            loreEntry: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            universeMap: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LoreService>(LoreService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return paginated lore entries', async () => {
      (prismaService.loreEntry.findMany as jest.Mock).mockResolvedValue([mockLoreEntry]);
      (prismaService.loreEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by category', async () => {
      (prismaService.loreEntry.findMany as jest.Mock).mockResolvedValue([mockLoreEntry]);
      (prismaService.loreEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, 'history');

      expect((prismaService.loreEntry.findMany as jest.Mock).mock.calls[0][0].where.category).toBe(
        'history'
      );
    });

    it('should filter by importance', async () => {
      (prismaService.loreEntry.findMany as jest.Mock).mockResolvedValue([mockLoreEntry]);
      (prismaService.loreEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, undefined, 'high');

      expect(
        (prismaService.loreEntry.findMany as jest.Mock).mock.calls[0][0].where.importance
      ).toBe('high');
    });
  });

  describe('getEntryBySlug', () => {
    it('should return lore entry', async () => {
      (prismaService.loreEntry.findUnique as jest.Mock).mockResolvedValue(mockLoreEntry);
      (prismaService.loreEntry.update as jest.Mock).mockResolvedValue(mockLoreEntry);

      const result = await service.getEntryBySlug('test-lore');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Test Lore');
    });

    it('should throw NotFoundException if lore not found', async () => {
      (prismaService.loreEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEntryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategories', () => {
    it('should return lore categories', async () => {
      (prismaService.loreEntry.findMany as jest.Mock).mockResolvedValue([{ category: 'history' }]);

      const result = await service.getCategories();

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).categories).toContain('history');
    });
  });

  describe('createEntry', () => {
    it('should create lore entry successfully', async () => {
      (prismaService.loreEntry.create as jest.Mock).mockResolvedValue(mockLoreEntry);

      const result = await service.createEntry({
        title: 'Test Lore',
        category: 'history',
        content: 'Test content',
        universeId: 'universe-1',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-lore');
    });
  });

  describe('updateEntry', () => {
    it('should update lore entry successfully', async () => {
      (prismaService.loreEntry.findUnique as jest.Mock).mockResolvedValue(mockLoreEntry);
      (prismaService.loreEntry.update as jest.Mock).mockResolvedValue({
        ...mockLoreEntry,
        title: 'Updated Lore',
        slug: 'updated-lore',
      });

      const result = await service.updateEntry('lore-1', { title: 'Updated Lore' });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Updated Lore');
    });

    it('should throw NotFoundException if lore not found', async () => {
      (prismaService.loreEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEntry('not-found', { title: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete lore entry successfully', async () => {
      (prismaService.loreEntry.findUnique as jest.Mock).mockResolvedValue(mockLoreEntry);
      (prismaService.loreEntry.delete as jest.Mock).mockResolvedValue(mockLoreEntry);

      const result = await service.deleteEntry('lore-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Entry deleted');
    });

    it('should throw NotFoundException if lore not found', async () => {
      (prismaService.loreEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEntry('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CelebrityService } from './celebrity.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CelebrityService', () => {
  let service: CelebrityService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockCelebrityEntry = {
    id: 'celebrity-1',
    name: 'Test Celebrity',
    slug: 'test-celebrity',
    bio: 'Test bio',
    coverImage: 'https://example.com/cover.jpg',
    profession: 'Actor',
    nationality: 'American',
    birthDate: new Date('1990-01-01'),
    socialLinks: '{}',
    isFeatured: true,
    viewCount: 100,
    status: 'published',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    createdById: 'user-123',
  };

  const mockCelebrityNews = {
    id: 'news-1',
    title: 'Test News',
    slug: 'test-news',
    content: 'Test content',
    excerpt: 'Test excerpt',
    coverImage: 'https://example.com/news.jpg',
    celebrityId: 'celebrity-1',
    status: 'published',
    publishedAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CelebrityService,
        {
          provide: PrismaService,
          useValue: {
            celebrityEntry: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            celebrityNews: {
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CelebrityService>(CelebrityService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return paginated celebrity entries', async () => {
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([mockCelebrityEntry]);
      (prismaService.celebrityEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by profession', async () => {
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([mockCelebrityEntry]);
      (prismaService.celebrityEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries(1, 20, 'Actor');

      expect(result.success).toBe(true);
      expect(
        (prismaService.celebrityEntry.findMany as jest.Mock).mock.calls[0][0].where.profession
      ).toBe('Actor');
    });

    it('should filter by featured', async () => {
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([mockCelebrityEntry]);
      (prismaService.celebrityEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, true);

      expect(
        (prismaService.celebrityEntry.findMany as jest.Mock).mock.calls[0][0].where.isFeatured
      ).toBe(true);
    });
  });

  describe('getEntryBySlug', () => {
    it('should return celebrity entry with news', async () => {
      (prismaService.celebrityEntry.findUnique as jest.Mock).mockResolvedValue({
        ...mockCelebrityEntry,
        news: [mockCelebrityNews],
      });
      (prismaService.celebrityEntry.update as jest.Mock).mockResolvedValue(mockCelebrityEntry);

      const result = await service.getEntryBySlug('test-celebrity');

      expect(result.success).toBe(true);
      expect((result.data as any).name).toBe('Test Celebrity');
      expect((result.data as any).news).toHaveLength(1);
    });

    it('should throw NotFoundException if celebrity not found', async () => {
      (prismaService.celebrityEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEntryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeatured', () => {
    it('should return featured celebrities', async () => {
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([mockCelebrityEntry]);

      const result = await service.getFeatured();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createEntry', () => {
    it('should create celebrity entry successfully', async () => {
      (prismaService.celebrityEntry.create as jest.Mock).mockResolvedValue(mockCelebrityEntry);

      const result = await service.createEntry({
        name: 'Test Celebrity',
        createdById: 'user-123',
      });

      expect(result.success).toBe(true);
      expect((result.data as any).slug).toBe('test-celebrity');
    });
  });

  describe('updateEntry', () => {
    it('should update celebrity entry successfully', async () => {
      (prismaService.celebrityEntry.findUnique as jest.Mock).mockResolvedValue(mockCelebrityEntry);
      (prismaService.celebrityEntry.update as jest.Mock).mockResolvedValue({
        ...mockCelebrityEntry,
        name: 'Updated Name',
        slug: 'updated-name',
      });

      const result = await service.updateEntry('celebrity-1', { name: 'Updated Name' });

      expect(result.success).toBe(true);
      expect((result.data as any).name).toBe('Updated Name');
    });

    it('should throw NotFoundException if celebrity not found', async () => {
      (prismaService.celebrityEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEntry('not-found', { name: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete celebrity entry successfully', async () => {
      (prismaService.celebrityEntry.findUnique as jest.Mock).mockResolvedValue(mockCelebrityEntry);
      (prismaService.celebrityEntry.delete as jest.Mock).mockResolvedValue(mockCelebrityEntry);

      const result = await service.deleteEntry('celebrity-1');

      expect(result.success).toBe(true);
      expect((result.data as any).message).toBe('Entry deleted successfully');
    });

    it('should throw NotFoundException if celebrity not found', async () => {
      (prismaService.celebrityEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEntry('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNews', () => {
    it('should return celebrity news', async () => {
      (prismaService.celebrityNews.findMany as jest.Mock).mockResolvedValue([mockCelebrityNews]);
      (prismaService.celebrityNews.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getNews('celebrity-1');

      expect(result.success).toBe(true);
      expect((result.data as any).items).toHaveLength(1);
    });
  });

  describe('createNews', () => {
    it('should create celebrity news successfully', async () => {
      (prismaService.celebrityNews.create as jest.Mock).mockResolvedValue(mockCelebrityNews);

      const result = await service.createNews({
        title: 'Test News',
        content: 'Test content',
        celebrityId: 'celebrity-1',
      });

      expect(result.success).toBe(true);
      expect((result.data as any).slug).toBe('test-news');
    });
  });
});

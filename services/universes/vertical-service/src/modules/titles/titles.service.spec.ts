import { Test, TestingModule } from '@nestjs/testing';
import { TitlesService } from './titles.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TitlesService', () => {
  let service: TitlesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTitle = {
    id: 'title-1',
    name: 'Test Title',
    slug: 'test-title',
    type: 'series',
    description: 'Test description',
    coverImage: 'https://example.com/cover.jpg',
    releaseYear: 2024,
    endYear: null,
    status: 'ongoing',
    rating: 4.5,
    universeId: 'universe-1',
    universe: { name: 'Test Universe' },
    viewCount: 100,
    createdAt: new Date('2024-01-01'),
    chapters: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TitlesService,
        {
          provide: PrismaService,
          useValue: {
            title: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            chapter: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            universeMap: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TitlesService>(TitlesService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTitles', () => {
    it('should return paginated titles', async () => {
      (prismaService.title.findMany as jest.Mock).mockResolvedValue([mockTitle]);
      (prismaService.title.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getTitles();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by type', async () => {
      (prismaService.title.findMany as jest.Mock).mockResolvedValue([mockTitle]);
      (prismaService.title.count as jest.Mock).mockResolvedValue(1);

      await service.getTitles(1, 20, undefined, 'series');

      expect((prismaService.title.findMany as jest.Mock).mock.calls[0][0].where.type).toBe(
        'series'
      );
    });
  });

  describe('getTitleBySlug', () => {
    it('should return title with chapters', async () => {
      (prismaService.title.findUnique as jest.Mock).mockResolvedValue(mockTitle);
      (prismaService.title.update as jest.Mock).mockResolvedValue(mockTitle);

      const result = await service.getTitleBySlug('test-title');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).name).toBe('Test Title');
    });

    it('should throw NotFoundException if title not found', async () => {
      (prismaService.title.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getTitleBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTitle', () => {
    it('should create title successfully', async () => {
      (prismaService.title.create as jest.Mock).mockResolvedValue(mockTitle);

      const result = await service.createTitle({
        name: 'Test Title',
        type: 'series',
        universeId: 'universe-1',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-title');
    });
  });

  describe('updateTitle', () => {
    it('should update title successfully', async () => {
      (prismaService.title.findUnique as jest.Mock).mockResolvedValue(mockTitle);
      (prismaService.title.update as jest.Mock).mockResolvedValue({
        ...mockTitle,
        name: 'Updated Title',
        slug: 'updated-title',
      });

      const result = await service.updateTitle('title-1', { name: 'Updated Title' });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).name).toBe('Updated Title');
    });

    it('should throw NotFoundException if title not found', async () => {
      (prismaService.title.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateTitle('not-found', { name: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteTitle', () => {
    it('should delete title successfully', async () => {
      (prismaService.title.findUnique as jest.Mock).mockResolvedValue(mockTitle);
      (prismaService.title.delete as jest.Mock).mockResolvedValue(mockTitle);

      const result = await service.deleteTitle('title-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if title not found', async () => {
      (prismaService.title.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteTitle('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});

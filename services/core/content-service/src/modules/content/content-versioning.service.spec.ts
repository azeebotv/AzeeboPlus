import { Test, TestingModule } from '@nestjs/testing';
import { ContentVersioningService } from './content-versioning.service';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '@azeebo/shared-services';
import { NotFoundException } from '@nestjs/common';

describe('ContentVersioningService', () => {
  let service: ContentVersioningService;

  const mockPrisma = {
    contentItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCache = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentVersioningService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ContentVersioningService>(ContentVersioningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSnapshot', () => {
    it('should create a version snapshot', async () => {
      const content = {
        id: 'content-1',
        title: 'Original Title',
        description: 'Description',
        thumbnail: 'thumb.jpg',
        mediaUrl: 'video.mp4',
        status: 'published',
        metadata: {},
        releaseDate: null,
        windowEndDate: null,
        windowType: 'standard',
        isExclusive: false,
        isPremiere: false,
      };
      mockPrisma.contentItem.findUnique.mockResolvedValue(content);
      mockPrisma.contentItem.update.mockResolvedValue({});

      const result = await service.createSnapshot('content-1', 'admin', 'Initial snapshot');

      expect(result.contentId).toBe('content-1');
      expect(result.versionNumber).toBe(1);
      expect(result.createdBy).toBe('admin');
      expect(result.changeNote).toBe('Initial snapshot');
      expect(result.snapshot).toHaveProperty('title', 'Original Title');

      expect(mockPrisma.contentItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'content-1' },
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              _latestVersion: 1,
              _versions: expect.arrayContaining([expect.objectContaining({ versionNumber: 1 })]),
            }),
          }),
        })
      );
    });

    it('should increment version number', async () => {
      const content = {
        id: 'content-1',
        title: 'Title',
        metadata: {
          _latestVersion: 3,
          _versions: [{ versionNumber: 3 }, { versionNumber: 2 }, { versionNumber: 1 }],
        },
      };
      mockPrisma.contentItem.findUnique.mockResolvedValue(content);
      mockPrisma.contentItem.update.mockResolvedValue({});

      const result = await service.createSnapshot('content-1');

      expect(result.versionNumber).toBe(4);
    });

    it('should throw NotFoundException when content not found', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue(null);

      await expect(service.createSnapshot('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should keep only last 20 versions', async () => {
      const versions = Array.from({ length: 20 }, (_, i) => ({ versionNumber: i + 1 }));
      const content = {
        id: 'content-1',
        title: 'Title',
        metadata: { _latestVersion: 20, _versions: versions },
      };
      mockPrisma.contentItem.findUnique.mockResolvedValue(content);
      mockPrisma.contentItem.update.mockResolvedValue({});

      await service.createSnapshot('content-1');

      const updateCall = mockPrisma.contentItem.update.mock.calls[0][0];
      const savedVersions = updateCall.data.metadata._versions;
      expect(savedVersions).toHaveLength(20);
      expect(savedVersions[0].versionNumber).toBe(2);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history', async () => {
      const versions = [
        { id: 'v1', versionNumber: 1 },
        { id: 'v2', versionNumber: 2 },
      ];
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        metadata: { _versions: versions },
      });

      const result = await service.getVersionHistory('content-1');

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when content not found', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue(null);

      await expect(service.getVersionHistory('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVersion', () => {
    it('should return specific version', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        metadata: {
          _versions: [
            { versionNumber: 1, id: 'v1' },
            { versionNumber: 2, id: 'v2' },
          ],
        },
      });

      const result = await service.getVersion('content-1', 2);

      expect(result).toBeDefined();
      expect(result!.versionNumber).toBe(2);
    });

    it('should return null when version not found', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        metadata: { _versions: [] },
      });

      const result = await service.getVersion('content-1', 99);

      expect(result).toBeNull();
    });
  });

  describe('rollbackToVersion', () => {
    it('should rollback to specified version', async () => {
      const content = {
        id: 'content-1',
        metadata: {
          _versions: [
            {
              versionNumber: 1,
              snapshot: {
                title: 'Old Title',
                description: 'Old Desc',
                thumbnail: 'old.jpg',
                mediaUrl: null,
                status: 'draft',
                metadata: {},
                releaseDate: null,
                windowEndDate: null,
                windowType: 'standard',
                isExclusive: false,
                isPremiere: false,
              },
            },
          ],
          _latestVersion: 1,
        },
      };
      mockPrisma.contentItem.findUnique.mockResolvedValue(content);
      mockPrisma.contentItem.update.mockResolvedValue({});
      mockCache.delete.mockResolvedValue(undefined);

      const result = await service.rollbackToVersion('content-1', 1, 'admin');

      expect(result.success).toBe(true);
      expect(mockPrisma.contentItem.update).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when version not found', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        metadata: { _versions: [] },
      });

      await expect(service.rollbackToVersion('content-1', 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions and find differences', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        metadata: {
          _versions: [
            {
              versionNumber: 1,
              snapshot: { title: 'Title V1', description: 'Desc V1' },
            },
            {
              versionNumber: 2,
              snapshot: { title: 'Title V2', description: 'Desc V1' },
            },
          ],
        },
      });

      const result = await service.compareVersions('content-1', 1, 2);

      expect(result.differences).toHaveLength(1);
      expect(result.differences[0].field).toBe('title');
      expect(result.differences[0].before).toBe('Title V1');
      expect(result.differences[0].after).toBe('Title V2');
    });

    it('should throw NotFoundException when one version not found', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        metadata: {
          _versions: [{ versionNumber: 1, snapshot: {} }],
        },
      });

      await expect(service.compareVersions('content-1', 1, 99)).rejects.toThrow(NotFoundException);
    });
  });
});

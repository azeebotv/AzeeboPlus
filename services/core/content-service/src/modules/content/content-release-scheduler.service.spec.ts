import { Test, TestingModule } from '@nestjs/testing';
import { ContentReleaseSchedulerService } from './content-release-scheduler.service';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '@azeebo/shared-services';
import { EventBusService, EventTypes } from '@azeebo/event-bus';

describe('ContentReleaseSchedulerService', () => {
  let service: ContentReleaseSchedulerService;

  const mockPrisma = {
    contentItem: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockCache = {
    delete: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentReleaseSchedulerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<ContentReleaseSchedulerService>(ContentReleaseSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleScheduledPublishes', () => {
    it('should auto-publish draft content with past releaseDate', async () => {
      const draftItems = [
        {
          id: 'item-1',
          title: 'Scheduled Movie',
          creatorId: 'creator-1',
          universeId: 'movie',
          releaseDate: new Date('2024-01-01'),
          universe: { name: 'movie' },
        },
      ];
      mockPrisma.contentItem.findMany.mockResolvedValue(draftItems);
      mockPrisma.contentItem.updateMany.mockResolvedValue({ count: 1 });
      mockCache.delete.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await service.handleScheduledPublishes();

      expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith({
        where: {
          status: 'draft',
          releaseDate: { lte: expect.any(Date) },
        },
        include: { universe: true },
      });

      expect(mockPrisma.contentItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['item-1'] } },
        data: {
          status: 'published',
          publishedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });

      expect(mockCache.delete).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalledWith(EventTypes.CONTENT_PUBLISHED, {
        contentId: 'item-1',
        creatorId: 'creator-1',
        universeId: 'movie',
        title: 'Scheduled Movie',
        scheduledAt: expect.any(String),
      });
    });

    it('should not publish when no items are ready', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([]);

      await service.handleScheduledPublishes();

      expect(mockPrisma.contentItem.updateMany).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async () => {
      mockPrisma.contentItem.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.handleScheduledPublishes()).resolves.not.toThrow();
    });
  });

  describe('handleWindowExpiry', () => {
    it('should archive content with expired streaming windows', async () => {
      const expiredContent = [
        {
          id: 'item-1',
          windowEndDate: new Date('2024-01-01'),
          windowType: 'premium',
        },
      ];
      mockPrisma.contentItem.findMany.mockResolvedValue(expiredContent);
      mockPrisma.contentItem.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWindowExpiry();

      expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith({
        where: {
          status: 'published',
          windowEndDate: { lte: expect.any(Date) },
          windowType: { not: 'permanent' },
        },
      });

      expect(mockPrisma.contentItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['item-1'] } },
        data: {
          status: 'archived',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should not archive permanent content', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([]);

      await service.handleWindowExpiry();

      expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith({
        where: {
          status: 'published',
          windowEndDate: { lte: expect.any(Date) },
          windowType: { not: 'permanent' },
        },
      });
    });
  });

  describe('validateReleaseWindow', () => {
    it('should return valid for correct parameters', () => {
      const result = service.validateReleaseWindow({
        releaseDate: new Date('2024-01-01'),
        windowEndDate: new Date('2024-02-01'),
        windowType: 'standard',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when releaseDate >= windowEndDate', () => {
      const result = service.validateReleaseWindow({
        releaseDate: new Date('2024-02-01'),
        windowEndDate: new Date('2024-01-01'),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('releaseDate must be before windowEndDate');
    });

    it('should reject premium window without windowEndDate', () => {
      const result = service.validateReleaseWindow({
        windowType: 'premium',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Premium window type requires a windowEndDate');
    });

    it('should reject invalid windowType', () => {
      const result = service.validateReleaseWindow({
        windowType: 'invalid',
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid windowType');
    });

    it('should reject theatrical date after streaming date', () => {
      const result = service.validateReleaseWindow({
        theatricalReleaseDate: new Date('2024-03-01'),
        streamingReleaseDate: new Date('2024-02-01'),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('theatricalReleaseDate must be before streamingReleaseDate');
    });
  });

  describe('getAvailableContent', () => {
    it('should return content with active windows', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([{ id: 'content-1' }, { id: 'content-2' }]);

      const result = await service.getAvailableContent();

      expect(result).toEqual(['content-1', 'content-2']);
    });

    it('should filter by universeId when provided', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([{ id: 'content-1' }]);

      await service.getAvailableContent('movie');

      expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            universeId: 'movie',
          }),
        })
      );
    });
  });
});

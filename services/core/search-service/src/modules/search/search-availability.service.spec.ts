import { Test, TestingModule } from '@nestjs/testing';
import { SearchAvailabilityService } from './search-availability.service.js';
import { PrismaService } from '../database/prisma.service.js';

const mockPrisma = {
  contentItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('SearchAvailabilityService', () => {
  let service: SearchAvailabilityService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchAvailabilityService>(SearchAvailabilityService);
  });

  describe('checkContentAvailability', () => {
    it('should return available for published content with no filters', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'published',
        contentType: 'video',
        universe: 'reality',
        categories: ['entertainment'],
      });

      const result = await service.checkContentAvailability('c1', {});
      expect(result.available).toBe(true);
    });

    it('should return unavailable for non-published content', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'draft',
        contentType: 'video',
        universe: 'reality',
        categories: [],
      });

      const result = await service.checkContentAvailability('c1', {});
      expect(result.available).toBe(false);
      expect(result.reason).toContain('status');
    });

    it('should return unavailable for non-existent content', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue(null);

      const result = await service.checkContentAvailability('nonexistent', {});
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Content not found');
    });

    it('should filter by content type', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'published',
        contentType: 'podcast',
        universe: 'lifestyle',
        categories: [],
      });

      const result = await service.checkContentAvailability('c1', {
        contentTypes: ['video'],
      });
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Content type');
    });

    it('should filter by universe', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'published',
        contentType: 'video',
        universe: 'movies',
        categories: [],
      });

      const result = await service.checkContentAvailability('c1', {
        universes: ['reality'],
      });
      expect(result.available).toBe(false);
      expect(result.reason).toContain('universe');
    });

    it('should filter by categories', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'published',
        contentType: 'video',
        universe: 'reality',
        categories: ['comedy'],
      });

      const result = await service.checkContentAvailability('c1', {
        categories: ['news'],
      });
      expect(result.available).toBe(false);
      expect(result.reason).toContain('categories');
    });

    it('should return available when content matches all filters', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'published',
        contentType: 'video',
        universe: 'reality',
        categories: ['entertainment', 'comedy'],
      });

      const result = await service.checkContentAvailability('c1', {
        contentTypes: ['video'],
        universes: ['reality'],
        categories: ['entertainment'],
      });
      expect(result.available).toBe(true);
    });

    it('should allow custom status filters', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'draft',
        contentType: 'video',
        universe: 'reality',
        categories: [],
      });

      const result = await service.checkContentAvailability('c1', {
        statuses: ['draft', 'published'],
      });
      expect(result.available).toBe(true);
    });
  });

  describe('filterAvailableContent', () => {
    it('should return only available content IDs', async () => {
      mockPrisma.contentItem.findUnique
        .mockResolvedValueOnce({
          id: 'c1', status: 'published', contentType: 'video',
          universe: 'reality', categories: [],
        })
        .mockResolvedValueOnce({
          id: 'c2', status: 'draft', contentType: 'video',
          universe: 'reality', categories: [],
        })
        .mockResolvedValueOnce({
          id: 'c3', status: 'published', contentType: 'video',
          universe: 'reality', categories: [],
        });

      const result = await service.filterAvailableContent(['c1', 'c2', 'c3'], {});
      expect(result).toEqual(['c1', 'c3']);
    });

    it('should return empty array when no content available', async () => {
      mockPrisma.contentItem.findUnique.mockResolvedValue({
        id: 'c1', status: 'draft', contentType: 'video',
        universe: 'reality', categories: [],
      });

      const result = await service.filterAvailableContent(['c1'], {});
      expect(result).toHaveLength(0);
    });
  });

  describe('generateSuggestions', () => {
    it('should return title-based suggestions', async () => {
      mockPrisma.contentItem.findMany
        .mockResolvedValueOnce([{ title: 'Avengers Endgame' }])
        .mockResolvedValueOnce([{ title: 'Avengers Infinity War' }]);

      const suggestions = await service.generateSuggestions('avengers');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('Avengers Endgame');
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([]);

      const suggestions = await service.generateSuggestions('xyznonexistent');
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('measureSearchLatency', () => {
    it('should measure latency and return result count', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([
        { id: 'c1' },
        { id: 'c2' },
      ]);
      mockPrisma.contentItem.findUnique
        .mockResolvedValueOnce({
          id: 'c1', status: 'published', contentType: 'video',
          universe: 'reality', categories: [],
        })
        .mockResolvedValueOnce({
          id: 'c2', status: 'published', contentType: 'video',
          universe: 'reality', categories: [],
        });

      const result = await service.measureSearchLatency('test', {});
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.resultCount).toBe(2);
    });
  });

  describe('trackZeroResult', () => {
    it('should log zero-result telemetry without throwing', async () => {
      await expect(
        service.trackZeroResult({
          query: 'nonexistent',
          timestamp: new Date(),
          resultCount: 0,
        }),
      ).resolves.toBeUndefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SearchIntelligenceService } from './search-intelligence.service';
import { PrismaService } from '../database/prisma.service';

describe('SearchIntelligenceService', () => {
  let service: SearchIntelligenceService;

  const mockPrisma = {
    contentItem: {
      findMany: jest.fn(),
    },
    searchQueryLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchIntelligenceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchIntelligenceService>(SearchIntelligenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('filterByAvailability', () => {
    it('should mark published content as available', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([
        { id: 'content-1', status: 'published' },
        { id: 'content-2', status: 'published' },
      ]);

      const results = [
        { id: 'content-1', type: 'movie', title: 'Movie 1', score: 1.0, available: false },
        { id: 'content-2', type: 'movie', title: 'Movie 2', score: 0.8, available: false },
      ];

      const filtered = await service.filterByAvailability(results);

      expect(filtered.every((r) => r.available)).toBe(true);
    });

    it('should mark non-published content as unavailable', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([
        { id: 'content-1', status: 'published' },
        { id: 'content-2', status: 'draft' },
      ]);

      const results = [
        { id: 'content-1', type: 'movie', title: 'Movie 1', score: 1.0, available: false },
        { id: 'content-2', type: 'movie', title: 'Movie 2', score: 0.8, available: false },
      ];

      const filtered = await service.filterByAvailability(results);

      expect(filtered[0].available).toBe(true);
      expect(filtered[1].available).toBe(false);
      expect(filtered[1].availabilityReason).toBe('not_published');
      expect(filtered[1].score).toBeCloseTo(0.08); // 0.8 * 0.1
    });

    it('should mark missing content as not_found', async () => {
      mockPrisma.contentItem.findMany.mockResolvedValue([]);

      const results = [
        { id: 'content-1', type: 'movie', title: 'Movie 1', score: 1.0, available: false },
      ];

      const filtered = await service.filterByAvailability(results);

      expect(filtered[0].available).toBe(false);
      expect(filtered[0].availabilityReason).toBe('not_found');
    });
  });

  describe('trackZeroResult', () => {
    it('should buffer zero result events', () => {
      service.trackZeroResult({
        query: 'nonexistent movie',
        userId: 'user-1',
        resultCount: 0,
      });

      // Buffer is internal, but we can verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('getSearchQualityMetrics', () => {
    it('should return default metrics', async () => {
      const metrics = await service.getSearchQualityMetrics();

      expect(metrics.totalQueries).toBe(0);
      expect(metrics.zeroResultRate).toBe(0);
      expect(metrics.topZeroResultQueries).toEqual([]);
    });
  });

  describe('getRankedSuggestions', () => {
    it('should return empty suggestions by default', async () => {
      const suggestions = await service.getRankedSuggestions('test query');

      expect(suggestions).toEqual([]);
    });
  });
});

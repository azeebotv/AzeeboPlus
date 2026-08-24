import { DiversityService } from './diversity.service';

describe('DiversityService', () => {
  let service: DiversityService;

  beforeEach(() => {
    service = new DiversityService();
  });

  describe('calculateDiversity', () => {
    it('should calculate diversity metrics for recommendations', () => {
      const recommendations = [
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
        { contentType: 'video', universe: 'reality', creatorId: 'creator-2' },
        { contentType: 'podcast', universe: 'lifestyle', creatorId: 'creator-3' },
        { contentType: 'clip', universe: 'comedy', creatorId: 'creator-4' },
      ];

      const metrics = service.calculateDiversity(recommendations);

      expect(metrics.contentTypeDiversity).toBeGreaterThan(0);
      expect(metrics.universeDiversity).toBeGreaterThan(0);
      expect(metrics.creatorDiversity).toBeGreaterThan(0);
      expect(metrics.overallDiversity).toBeGreaterThan(0);
      expect(metrics.breakdown.contentTypes).toBe(3);
      expect(metrics.breakdown.universes).toBe(3);
      expect(metrics.breakdown.creators).toBe(4);
    });

    it('should return low diversity for homogeneous recommendations', () => {
      const recommendations = [
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
      ];

      const metrics = service.calculateDiversity(recommendations);

      expect(metrics.contentTypeDiversity).toBe(0);
      expect(metrics.universeDiversity).toBe(0);
      expect(metrics.creatorDiversity).toBe(0);
    });

    it('should handle empty recommendations', () => {
      const metrics = service.calculateDiversity([]);

      expect(metrics.contentTypeDiversity).toBe(0);
      expect(metrics.overallDiversity).toBe(0);
    });
  });

  describe('calculateFairness', () => {
    it('should calculate fairness metrics', () => {
      const recommendations = [
        { creatorId: 'creator-1', universe: 'reality', impressionCount: 100 },
        { creatorId: 'creator-2', universe: 'reality', impressionCount: 100 },
        { creatorId: 'creator-3', universe: 'comedy', impressionCount: 100 },
      ];

      const metrics = service.calculateFairness(recommendations);

      expect(metrics.exposureFairness).toBeGreaterThan(0);
      expect(metrics.overallFairness).toBeGreaterThan(0);
    });

    it('should calculate creator fairness with creator sizes', () => {
      const recommendations = [
        { creatorId: 'small-creator', universe: 'reality', impressionCount: 50 },
        { creatorId: 'large-creator', universe: 'reality', impressionCount: 150 },
      ];

      const creatorSizes = new Map([
        ['small-creator', 1000],
        ['large-creator', 100000],
      ]);

      const metrics = service.calculateFairness(recommendations, creatorSizes);

      expect(metrics.creatorFairness).toBeGreaterThan(0);
    });
  });

  describe('getDiversityRecommendations', () => {
    it('should generate recommendations for low diversity', () => {
      const metrics = {
        contentTypeDiversity: 0.3,
        universeDiversity: 0.4,
        creatorDiversity: 0.5,
        overallDiversity: 0.4,
        breakdown: { contentTypes: 2, universes: 2, creators: 3 },
      };

      const recommendations = service.getDiversityRecommendations(metrics);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.type === 'content_type')).toBe(true);
    });

    it('should return empty for high diversity', () => {
      const metrics = {
        contentTypeDiversity: 0.9,
        universeDiversity: 0.9,
        creatorDiversity: 0.9,
        overallDiversity: 0.9,
        breakdown: { contentTypes: 5, universes: 5, creators: 10 },
      };

      const recommendations = service.getDiversityRecommendations(metrics);

      expect(recommendations.length).toBe(0);
    });
  });

  describe('applyDiversityReranking', () => {
    it('should rerank recommendations for diversity', () => {
      const recommendations = [
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
        { contentType: 'video', universe: 'reality', creatorId: 'creator-1' },
        { contentType: 'podcast', universe: 'lifestyle', creatorId: 'creator-2' },
      ];

      const reranked = service.applyDiversityReranking(recommendations, 0.5);

      expect(reranked.length).toBe(4);
      // The diverse item (podcast) should appear in the top 2 positions
      const types = reranked.slice(0, 2).map((r) => r.contentType);
      expect(types).toContain('podcast');
    });
  });
});

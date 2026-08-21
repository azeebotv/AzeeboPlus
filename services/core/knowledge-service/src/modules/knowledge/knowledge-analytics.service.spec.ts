import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeAnalyticsService } from './knowledge-analytics.service';

describe('KnowledgeAnalyticsService', () => {
  let service: KnowledgeAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KnowledgeAnalyticsService],
    }).compile();

    service = module.get<KnowledgeAnalyticsService>(KnowledgeAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCoverageMetrics', () => {
    it('should calculate coverage metrics correctly', () => {
      const result = service.calculateCoverageMetrics(100, 80, 50, 100);

      expect(result.totalKnowledgeUnits).toBe(100);
      expect(result.grantedKnowledgeUnits).toBe(80);
      expect(result.coveragePercent).toBe(80);
      expect(result.usersWithKnowledge).toBe(50);
    });

    it('should handle zero total knowledge units', () => {
      const result = service.calculateCoverageMetrics(0, 0, 0, 100);

      expect(result.coveragePercent).toBe(0);
      expect(result.avgKnowledgePerUser).toBe(0);
    });

    it('should handle zero users', () => {
      const result = service.calculateCoverageMetrics(100, 50, 0, 100);

      expect(result.usersWithKnowledge).toBe(0);
      expect(result.avgKnowledgePerUser).toBe(0);
    });
  });

  describe('calculateDistributionMetrics', () => {
    it('should calculate distribution metrics for equal grants', () => {
      const result = service.calculateDistributionMetrics([10, 10, 10, 10, 10]);

      expect(result.giniCoefficient).toBe(0);
      expect(result.belowMedianPercent).toBe(0);
      expect(result.aboveMedianPercent).toBe(100);
    });

    it('should calculate distribution metrics for unequal grants', () => {
      const result = service.calculateDistributionMetrics([1, 2, 3, 4, 100]);

      expect(result.giniCoefficient).toBeGreaterThan(0);
      expect(result.topTenPercentShare).toBeGreaterThan(50);
    });

    it('should handle empty array', () => {
      const result = service.calculateDistributionMetrics([]);

      expect(result.giniCoefficient).toBe(0);
      expect(result.belowMedianPercent).toBe(0);
    });

    it('should handle single user', () => {
      const result = service.calculateDistributionMetrics([10]);

      expect(result.giniCoefficient).toBe(0);
      expect(result.belowMedianPercent).toBe(0);
      expect(result.aboveMedianPercent).toBe(100);
    });
  });

  describe('calculateSpoilerMetrics', () => {
    it('should calculate spoiler metrics correctly', () => {
      const result = service.calculateSpoilerMetrics(100, 95, 5);

      expect(result.totalSpoilerContent).toBe(100);
      expect(result.correctlyFiltered).toBe(95);
      expect(result.effectivenessPercent).toBe(95);
      expect(result.spoilerLeaks).toBe(5);
    });

    it('should handle zero spoiler content', () => {
      const result = service.calculateSpoilerMetrics(0, 0, 0);

      expect(result.effectivenessPercent).toBe(100);
    });

    it('should handle perfect protection', () => {
      const result = service.calculateSpoilerMetrics(100, 100, 0);

      expect(result.effectivenessPercent).toBe(100);
      expect(result.spoilerLeaks).toBe(0);
    });
  });

  describe('calculateCrossFormatMetrics', () => {
    it('should calculate cross-format metrics correctly', () => {
      const result = service.calculateCrossFormatMetrics(20, 10, 30);

      expect(result.totalEquivalenceSets).toBe(20);
      expect(result.multiFormatSets).toBe(10);
      expect(result.coveragePercent).toBe(50);
      expect(result.avgFormatsPerSet).toBe(1.5);
    });

    it('should handle zero equivalence sets', () => {
      const result = service.calculateCrossFormatMetrics(0, 0, 0);

      expect(result.coveragePercent).toBe(0);
      expect(result.avgFormatsPerSet).toBe(0);
    });
  });

  describe('generateHealthReport', () => {
    it('should generate health report with high scores', () => {
      const coverage = service.calculateCoverageMetrics(100, 90, 80, 100);
      const distribution = service.calculateDistributionMetrics([10, 11, 12, 13, 14]);
      const spoiler = service.calculateSpoilerMetrics(100, 100, 0);
      const crossFormat = service.calculateCrossFormatMetrics(20, 15, 45);

      const report = service.generateHealthReport(
        coverage,
        distribution,
        spoiler,
        crossFormat,
      );

      expect(report.healthScore).toBe(100);
      expect(report.recommendations).toHaveLength(0);
      expect(report.generatedAt).toBeDefined();
    });

    it('should generate health report with recommendations for poor metrics', () => {
      const coverage = service.calculateCoverageMetrics(100, 20, 10, 100);
      const distribution = service.calculateDistributionMetrics([1, 1, 1, 1, 100]);
      const spoiler = service.calculateSpoilerMetrics(100, 80, 20);
      const crossFormat = service.calculateCrossFormatMetrics(20, 2, 4);

      const report = service.generateHealthReport(
        coverage,
        distribution,
        spoiler,
        crossFormat,
      );

      expect(report.healthScore).toBeLessThan(80);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should include all metrics in report', () => {
      const coverage = service.calculateCoverageMetrics(100, 80, 50, 100);
      const distribution = service.calculateDistributionMetrics([10, 20, 30]);
      const spoiler = service.calculateSpoilerMetrics(100, 95, 5);
      const crossFormat = service.calculateCrossFormatMetrics(10, 5, 15);

      const report = service.generateHealthReport(
        coverage,
        distribution,
        spoiler,
        crossFormat,
      );

      expect(report.coverage).toEqual(coverage);
      expect(report.distribution).toEqual(distribution);
      expect(report.spoilerProtection).toEqual(spoiler);
      expect(report.crossFormat).toEqual(crossFormat);
    });
  });

  describe('analyzeKnowledgeGaps', () => {
    it('should return empty array for empty grants', () => {
      const result = service.analyzeKnowledgeGaps(new Map(), 100);
      expect(result).toEqual([]);
    });

    it('should identify high-severity gaps', () => {
      const grants = new Map([
        ['ku-1', 5],
        ['ku-2', 2],
        ['ku-3', 50],
      ]);

      const result = service.analyzeKnowledgeGaps(grants, 100);

      expect(result.length).toBe(3);
      expect(result[0].gapSeverity).toBe('high'); // 2%
      expect(result[1].gapSeverity).toBe('high'); // 5% (< 10%)
      expect(result[2].gapSeverity).toBe('low'); // 50%
    });

    it('should sort by coverage ascending', () => {
      const grants = new Map([
        ['ku-1', 50],
        ['ku-2', 10],
        ['ku-3', 30],
      ]);

      const result = service.analyzeKnowledgeGaps(grants, 100);

      expect(result[0].knowledgeUnitId).toBe('ku-2');
      expect(result[1].knowledgeUnitId).toBe('ku-3');
      expect(result[2].knowledgeUnitId).toBe('ku-1');
    });

    it('should handle zero total users', () => {
      const grants = new Map([['ku-1', 10]]);

      const result = service.analyzeKnowledgeGaps(grants, 0);

      expect(result.length).toBe(1);
      expect(result[0].coveragePercent).toBe(0);
      expect(result[0].gapSeverity).toBe('high');
    });

    it('should classify gaps correctly', () => {
      const grants = new Map([
        ['ku-1', 5], // 5% = high
        ['ku-2', 15], // 15% = medium
        ['ku-3', 25], // 25% = medium
        ['ku-4', 50], // 50% = low
        ['ku-5', 90], // 90% = low
      ]);

      const result = service.analyzeKnowledgeGaps(grants, 100);

      const high = result.filter(r => r.gapSeverity === 'high');
      const medium = result.filter(r => r.gapSeverity === 'medium');
      const low = result.filter(r => r.gapSeverity === 'low');

      expect(high.length).toBe(1);
      expect(medium.length).toBe(2);
      expect(low.length).toBe(2);
    });
  });
});

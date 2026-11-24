import { Injectable } from '@nestjs/common';

// ============================================================================
// Knowledge Parity Analytics (AZP-KNOW-012)
//
// Tracks and analyzes knowledge graph health:
// - Knowledge coverage across users
// - Grant distribution fairness
// - Spoiler protection effectiveness
// - Cross-format equivalence coverage
// ============================================================================

export interface KnowledgeCoverageMetrics {
  /** Total knowledge units in system */
  totalKnowledgeUnits: number;
  /** Knowledge units with at least one grant */
  grantedKnowledgeUnits: number;
  /** Coverage percentage */
  coveragePercent: number;
  /** Users with any knowledge */
  usersWithKnowledge: number;
  /** Average knowledge units per user */
  avgKnowledgePerUser: number;
}

export interface GrantDistributionMetrics {
  /** Gini coefficient for grant distribution (0=equal, 1=unequal) */
  giniCoefficient: number;
  /** Percentage of users with below-median grants */
  belowMedianPercent: number;
  /** Percentage of users with above-median grants */
  aboveMedianPercent: number;
  /** Top 10% grant holders percentage of total grants */
  topTenPercentShare: number;
}

export interface SpoilerProtectionMetrics {
  /** Total content with spoiler levels */
  totalSpoilerContent: number;
  /** Content correctly filtered by spoiler level */
  correctlyFiltered: number;
  /** Spoiler protection effectiveness percentage */
  effectivenessPercent: number;
  /** Users who encountered spoilers (should be 0) */
  spoilerLeaks: number;
}

export interface CrossFormatMetrics {
  /** Total equivalence sets */
  totalEquivalenceSets: number;
  /** Equivalence sets with multiple formats */
  multiFormatSets: number;
  /** Cross-format coverage percentage */
  coveragePercent: number;
  /** Average formats per equivalence set */
  avgFormatsPerSet: number;
}

export interface KnowledgeHealthReport {
  coverage: KnowledgeCoverageMetrics;
  distribution: GrantDistributionMetrics;
  spoilerProtection: SpoilerProtectionMetrics;
  crossFormat: CrossFormatMetrics;
  /** Overall health score (0-100) */
  healthScore: number;
  /** Recommendations for improvement */
  recommendations: string[];
  generatedAt: Date;
}

@Injectable()
export class KnowledgeAnalyticsService {
  /**
   * Calculate knowledge coverage metrics
   */
  calculateCoverageMetrics(
    totalKnowledgeUnits: number,
    grantedKnowledgeUnits: number,
    usersWithKnowledge: number,
    _totalUsers: number
  ): KnowledgeCoverageMetrics {
    const coveragePercent =
      totalKnowledgeUnits > 0 ? (grantedKnowledgeUnits / totalKnowledgeUnits) * 100 : 0;

    const avgKnowledgePerUser =
      usersWithKnowledge > 0
        ? (grantedKnowledgeUnits * totalKnowledgeUnits) / usersWithKnowledge // Simplified
        : 0;

    return {
      totalKnowledgeUnits,
      grantedKnowledgeUnits,
      coveragePercent: Math.round(coveragePercent * 100) / 100,
      usersWithKnowledge,
      avgKnowledgePerUser: Math.round(avgKnowledgePerUser * 100) / 100,
    };
  }

  /**
   * Calculate grant distribution metrics
   */
  calculateDistributionMetrics(userGrantCounts: number[]): GrantDistributionMetrics {
    if (userGrantCounts.length === 0) {
      return {
        giniCoefficient: 0,
        belowMedianPercent: 0,
        aboveMedianPercent: 0,
        topTenPercentShare: 0,
      };
    }

    const sorted = [...userGrantCounts].sort((a, b) => a - b);
    const n = sorted.length;
    const median = sorted[Math.floor(n / 2)];
    const total = sorted.reduce((a, b) => a + b, 0);

    const belowMedian = sorted.filter((c) => c < median).length;
    const aboveMedian = sorted.filter((c) => c >= median).length;

    const topTenPercentIndex = Math.floor(n * 0.1);
    const topTenPercentSum = sorted.slice(topTenPercentIndex).reduce((a, b) => a + b, 0);
    const topTenPercentShare = total > 0 ? (topTenPercentSum / total) * 100 : 0;

    // Calculate Gini coefficient
    let sumAbsoluteDifferences = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumAbsoluteDifferences += Math.abs(sorted[i] - sorted[j]);
      }
    }
    const mean = total / n;
    const giniCoefficient = mean > 0 ? sumAbsoluteDifferences / (2 * n * n * mean) : 0;

    return {
      giniCoefficient: Math.round(giniCoefficient * 1000) / 1000,
      belowMedianPercent: Math.round((belowMedian / n) * 10000) / 100,
      aboveMedianPercent: Math.round((aboveMedian / n) * 10000) / 100,
      topTenPercentShare: Math.round(topTenPercentShare * 100) / 100,
    };
  }

  /**
   * Calculate spoiler protection metrics
   */
  calculateSpoilerMetrics(
    totalSpoilerContent: number,
    correctlyFiltered: number,
    spoilerLeaks: number
  ): SpoilerProtectionMetrics {
    const effectivenessPercent =
      totalSpoilerContent > 0 ? (correctlyFiltered / totalSpoilerContent) * 100 : 100;

    return {
      totalSpoilerContent,
      correctlyFiltered,
      effectivenessPercent: Math.round(effectivenessPercent * 100) / 100,
      spoilerLeaks,
    };
  }

  /**
   * Calculate cross-format metrics
   */
  calculateCrossFormatMetrics(
    totalEquivalenceSets: number,
    multiFormatSets: number,
    totalFormatsInSets: number
  ): CrossFormatMetrics {
    const coveragePercent =
      totalEquivalenceSets > 0 ? (multiFormatSets / totalEquivalenceSets) * 100 : 0;

    const avgFormatsPerSet =
      totalEquivalenceSets > 0 ? totalFormatsInSets / totalEquivalenceSets : 0;

    return {
      totalEquivalenceSets,
      multiFormatSets,
      coveragePercent: Math.round(coveragePercent * 100) / 100,
      avgFormatsPerSet: Math.round(avgFormatsPerSet * 100) / 100,
    };
  }

  /**
   * Generate comprehensive health report
   */
  generateHealthReport(
    coverage: KnowledgeCoverageMetrics,
    distribution: GrantDistributionMetrics,
    spoilerProtection: SpoilerProtectionMetrics,
    crossFormat: CrossFormatMetrics
  ): KnowledgeHealthReport {
    const recommendations: string[] = [];

    // Calculate health score (0-100)
    let healthScore = 100;

    // Coverage penalty
    if (coverage.coveragePercent < 50) {
      healthScore -= 20;
      recommendations.push('Increase knowledge coverage - many units have no grants');
    }

    // Distribution penalty
    if (distribution.giniCoefficient > 0.5) {
      healthScore -= 15;
      recommendations.push('Knowledge grants are unevenly distributed');
    }

    // Spoiler protection penalty
    if (spoilerProtection.effectivenessPercent < 95) {
      healthScore -= 25;
      recommendations.push('Spoiler protection needs improvement - leaks detected');
    }

    // Cross-format penalty
    if (crossFormat.coveragePercent < 30) {
      healthScore -= 10;
      recommendations.push('Add more cross-format equivalence mappings');
    }

    // Ensure score is within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      coverage,
      distribution,
      spoilerProtection,
      crossFormat,
      healthScore,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Get knowledge gap analysis
   */
  analyzeKnowledgeGaps(
    knowledgeUnitGrants: Map<string, number>, // unitId → grant count
    totalUsers: number
  ): Array<{
    knowledgeUnitId: string;
    grantCount: number;
    coveragePercent: number;
    gapSeverity: 'low' | 'medium' | 'high';
  }> {
    const gaps: Array<{
      knowledgeUnitId: string;
      grantCount: number;
      coveragePercent: number;
      gapSeverity: 'low' | 'medium' | 'high';
    }> = [];

    for (const [unitId, grantCount] of knowledgeUnitGrants) {
      const coveragePercent = totalUsers > 0 ? (grantCount / totalUsers) * 100 : 0;

      let gapSeverity: 'low' | 'medium' | 'high';
      if (coveragePercent < 10) gapSeverity = 'high';
      else if (coveragePercent < 30) gapSeverity = 'medium';
      else gapSeverity = 'low';

      gaps.push({
        knowledgeUnitId: unitId,
        grantCount,
        coveragePercent: Math.round(coveragePercent * 100) / 100,
        gapSeverity,
      });
    }

    return gaps.sort((a, b) => a.coveragePercent - b.coveragePercent);
  }
}

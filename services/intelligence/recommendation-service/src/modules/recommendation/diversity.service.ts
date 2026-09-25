import { Injectable } from '@nestjs/common';

// ============================================================================
// Recommendation Diversity & Fairness Metrics
//
// Measures and ensures recommendations are diverse and fair across:
// - Content types
// - Universes
// - Creators
// - Demographics (when available)
// ============================================================================

export interface DiversityMetrics {
  /** Content type diversity (Shannon entropy) */
  contentTypeDiversity: number;
  /** Universe diversity */
  universeDiversity: number;
  /** Creator diversity */
  creatorDiversity: number;
  /** Overall diversity score (0-1) */
  overallDiversity: number;
  /** Metrics breakdown */
  breakdown: Record<string, number>;
}

export interface FairnessMetrics {
  /** Exposure fairness across content items */
  exposureFairness: number;
  /** Creator fairness (small vs large creators) */
  creatorFairness: number;
  /** Universe fairness */
  universeFairness: number;
  /** Overall fairness score (0-1) */
  overallFairness: number;
}

export interface DiversityRecommendation {
  type: 'content_type' | 'universe' | 'creator' | 'age';
  current: number;
  target: number;
  recommendation: string;
}

@Injectable()
export class DiversityService {
  // Target diversity thresholds
  private readonly DIVERSITY_TARGETS = {
    contentType: 0.7, // Shannon entropy normalized
    universe: 0.6,
    creator: 0.8,
    overall: 0.7,
  };

  /**
   * Calculate Shannon entropy (diversity measure)
   */
  private shannonEntropy(counts: number[]): number {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    let entropy = 0;
    for (const count of counts) {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    }

    // Normalize by maximum possible entropy
    const maxEntropy = Math.log2(counts.length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * Calculate diversity metrics for a list of recommendations
   */
  calculateDiversity(
    recommendations: Array<{
      contentType?: string;
      universe?: string;
      creatorId?: string;
    }>
  ): DiversityMetrics {
    // Count by content type
    const contentTypeCounts = new Map<string, number>();
    for (const rec of recommendations) {
      const type = rec.contentType || 'unknown';
      contentTypeCounts.set(type, (contentTypeCounts.get(type) || 0) + 1);
    }

    // Count by universe
    const universeCounts = new Map<string, number>();
    for (const rec of recommendations) {
      const universe = rec.universe || 'unknown';
      universeCounts.set(universe, (universeCounts.get(universe) || 0) + 1);
    }

    // Count by creator
    const creatorCounts = new Map<string, number>();
    for (const rec of recommendations) {
      const creator = rec.creatorId || 'unknown';
      creatorCounts.set(creator, (creatorCounts.get(creator) || 0) + 1);
    }

    const contentTypeDiversity = this.shannonEntropy(Array.from(contentTypeCounts.values()));
    const universeDiversity = this.shannonEntropy(Array.from(universeCounts.values()));
    const creatorDiversity = this.shannonEntropy(Array.from(creatorCounts.values()));

    const overallDiversity = (contentTypeDiversity + universeDiversity + creatorDiversity) / 3;

    return {
      contentTypeDiversity: Math.round(contentTypeDiversity * 1000) / 1000,
      universeDiversity: Math.round(universeDiversity * 1000) / 1000,
      creatorDiversity: Math.round(creatorDiversity * 1000) / 1000,
      overallDiversity: Math.round(overallDiversity * 1000) / 1000,
      breakdown: {
        contentTypes: contentTypeCounts.size,
        universes: universeCounts.size,
        creators: creatorCounts.size,
      },
    };
  }

  /**
   * Calculate fairness metrics
   */
  calculateFairness(
    recommendations: Array<{
      creatorId?: string;
      universe?: string;
      impressionCount?: number;
    }>,
    creatorSizes?: Map<string, number> // creatorId → follower count
  ): FairnessMetrics {
    // Exposure fairness (Gini coefficient)
    const impressions = recommendations.map((r) => r.impressionCount || 1);
    const exposureFairness = 1 - this.giniCoefficient(impressions);

    // Creator fairness (small creators get proportional exposure)
    let creatorFairness = 1;
    if (creatorSizes && creatorSizes.size > 0) {
      const smallCreatorExposure = recommendations.filter((r) => {
        const size = creatorSizes.get(r.creatorId || '') || 0;
        return size < 10000; // Small creator threshold
      }).length;
      const totalRecommendations = recommendations.length;
      creatorFairness = totalRecommendations > 0 ? smallCreatorExposure / totalRecommendations : 1;
    }

    // Universe fairness
    const universeCounts = new Map<string, number>();
    for (const rec of recommendations) {
      const universe = rec.universe || 'unknown';
      universeCounts.set(universe, (universeCounts.get(universe) || 0) + 1);
    }
    const universeValues = Array.from(universeCounts.values());
    const universeFairness =
      universeValues.length > 0 ? 1 - this.coefficientOfVariation(universeValues) : 1;

    const overallFairness = (exposureFairness + creatorFairness + universeFairness) / 3;

    return {
      exposureFairness: Math.round(exposureFairness * 1000) / 1000,
      creatorFairness: Math.round(creatorFairness * 1000) / 1000,
      universeFairness: Math.round(universeFairness * 1000) / 1000,
      overallFairness: Math.round(overallFairness * 1000) / 1000,
    };
  }

  /**
   * Calculate Gini coefficient (inequality measure)
   */
  private giniCoefficient(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((a, b) => a + b, 0) / n;

    if (mean === 0) return 0;

    let sumAbsoluteDifferences = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumAbsoluteDifferences += Math.abs(sorted[i] - sorted[j]);
      }
    }

    return sumAbsoluteDifferences / (2 * n * n * mean);
  }

  /**
   * Calculate coefficient of variation
   */
  private coefficientOfVariation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean;
  }

  /**
   * Generate diversity improvement recommendations
   */
  getDiversityRecommendations(metrics: DiversityMetrics): DiversityRecommendation[] {
    const recommendations: DiversityRecommendation[] = [];

    if (metrics.contentTypeDiversity < this.DIVERSITY_TARGETS.contentType) {
      recommendations.push({
        type: 'content_type',
        current: metrics.contentTypeDiversity,
        target: this.DIVERSITY_TARGETS.contentType,
        recommendation: 'Increase content type variety in recommendations',
      });
    }

    if (metrics.universeDiversity < this.DIVERSITY_TARGETS.universe) {
      recommendations.push({
        type: 'universe',
        current: metrics.universeDiversity,
        target: this.DIVERSITY_TARGETS.universe,
        recommendation: 'Include more universes in recommendations',
      });
    }

    if (metrics.creatorDiversity < this.DIVERSITY_TARGETS.creator) {
      recommendations.push({
        type: 'creator',
        current: metrics.creatorDiversity,
        target: this.DIVERSITY_TARGETS.creator,
        recommendation: 'Feature more diverse creators',
      });
    }

    return recommendations;
  }

  /**
   * Apply diversity re-ranking to recommendations
   */
  applyDiversityReranking<
    T extends { contentType?: string; universe?: string; creatorId?: string },
  >(recommendations: T[], diversityWeight: number = 0.3): T[] {
    // Simple MMR (Maximal Marginal Relevance) inspired re-ranking
    const reranked: T[] = [];
    const remaining = [...recommendations];

    while (remaining.length > 0 && reranked.length < recommendations.length) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = 1 - i / remaining.length; // Original rank as relevance

        // Calculate diversity against already selected items
        let diversity = 1;
        if (reranked.length > 0) {
          const similarCount = reranked.filter(
            (r) =>
              r.contentType === candidate.contentType ||
              r.universe === candidate.universe ||
              r.creatorId === candidate.creatorId
          ).length;
          diversity = 1 - similarCount / reranked.length;
        }

        const score = (1 - diversityWeight) * relevance + diversityWeight * diversity;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      reranked.push(remaining.splice(bestIndex, 1)[0]);
    }

    return reranked;
  }
}

import { Injectable } from '@nestjs/common';

// ============================================================================
// Analytics Storage Tiers (TAA §40)
//
// Three-tier storage strategy for analytics data:
// - Hot: Recent events for debugging/live dashboards (Redis/PostgreSQL)
// - Warehouse: Curated facts/dimensions for reporting (PostgreSQL/data warehouse)
// - Archive: Lower-cost long-term retention (S3/cold storage)
// ============================================================================

export type StorageTier = 'hot' | 'warehouse' | 'archive';

export interface StorageTierConfig {
  tier: StorageTier;
  retentionDays: number;
  description: string;
  costPerGB: number; // Approximate monthly cost
  accessLatency: string;
  useCases: string[];
}

export interface DataMovementPolicy {
  sourceTier: StorageTier;
  destinationTier: StorageTier;
  triggerDays: number; // Days after creation to move
  enabled: boolean;
}

export interface StorageMetrics {
  tier: StorageTier;
  totalRecords: number;
  totalSizeGB: number;
  oldestRecord: Date;
  newestRecord: Date;
  dailyIngestionRate: number;
  estimatedMonthlyCost: number;
}

export interface ArchiveJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsMoved: number;
  error?: string;
}

@Injectable()
export class StorageTierService {
  private readonly TIER_CONFIGS: Record<StorageTier, StorageTierConfig> = {
    hot: {
      tier: 'hot',
      retentionDays: 30,
      description: 'Recent events for debugging and live dashboards',
      costPerGB: 0.10, // PostgreSQL/Redis
      accessLatency: 'milliseconds',
      useCases: [
        'Real-time dashboards',
        'Debugging recent issues',
        'Live user activity',
        'API response caching',
      ],
    },
    warehouse: {
      tier: 'warehouse',
      retentionDays: 365,
      description: 'Curated facts and dimensions for reporting',
      costPerGB: 0.02, // Data warehouse
      accessLatency: 'seconds',
      useCases: [
        'Business intelligence reports',
        'Historical trend analysis',
        'Cohort analysis',
        'Revenue reporting',
      ],
    },
    archive: {
      tier: 'archive',
      retentionDays: 2555, // ~7 years
      description: 'Lower-cost long-term retention for compliance',
      costPerGB: 0.004, // S3 Glacier
      accessLatency: 'minutes-hours',
      useCases: [
        'Compliance retention',
        'Legal holds',
        'Historical research',
        'Audit trails',
      ],
    },
  };

  private readonly MOVEMENT_POLICIES: DataMovementPolicy[] = [
    { sourceTier: 'hot', destinationTier: 'warehouse', triggerDays: 30, enabled: true },
    { sourceTier: 'warehouse', destinationTier: 'archive', triggerDays: 365, enabled: true },
  ];

  /**
   * Get configuration for a storage tier
   */
  getTierConfig(tier: StorageTier): StorageTierConfig {
    return this.TIER_CONFIGS[tier];
  }

  /**
   * Get all tier configurations
   */
  getAllTierConfigs(): StorageTierConfig[] {
    return Object.values(this.TIER_CONFIGS);
  }

  /**
   * Get data movement policies
   */
  getMovementPolicies(): DataMovementPolicy[] {
    return [...this.MOVEMENT_POLICIES];
  }

  /**
   * Calculate which tier an event should be in based on age
   */
  getRecommendedTier(eventAge: Date): StorageTier {
    const daysSinceCreation = Math.floor(
      (Date.now() - eventAge.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation <= this.TIER_CONFIGS.hot.retentionDays) {
      return 'hot';
    } else if (daysSinceCreation <= this.TIER_CONFIGS.warehouse.retentionDays) {
      return 'warehouse';
    } else {
      return 'archive';
    }
  }

  /**
   * Calculate estimated monthly cost for a tier
   */
  estimateMonthlyCost(tier: StorageTier, sizeGB: number): number {
    const config = this.TIER_CONFIGS[tier];
    return sizeGB * config.costPerGB;
  }

  /**
   * Calculate total cost across all tiers
   */
  estimateTotalMonthlyCost(metrics: StorageMetrics[]): number {
    return metrics.reduce((total, m) => total + m.estimatedMonthlyCost, 0);
  }

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizations(metrics: StorageMetrics[]): Array<{
    tier: StorageTier;
    recommendation: string;
    estimatedSavings: number;
  }> {
    const optimizations: Array<{
      tier: StorageTier;
      recommendation: string;
      estimatedSavings: number;
    }> = [];

    for (const metric of metrics) {
      // Tier config is used for cost calculations below

      // Check if hot tier is overutilized
      if (metric.tier === 'hot' && metric.totalRecords > 10000000) {
        optimizations.push({
          tier: 'hot',
          recommendation: 'Hot tier has >10M records. Consider moving older data to warehouse.',
          estimatedSavings: this.estimateMonthlyCost('hot', metric.totalSizeGB * 0.3),
        });
      }

      // Check if warehouse could be archived
      if (metric.tier === 'warehouse' && metric.oldestRecord) {
        const daysSinceOldest = Math.floor(
          (Date.now() - metric.oldestRecord.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceOldest > 365) {
          const archiveableSize = metric.totalSizeGB * 0.5; // Estimate 50% is old enough
          optimizations.push({
            tier: 'warehouse',
            recommendation: 'Warehouse has data older than 1 year. Consider archiving.',
            estimatedSavings: this.estimateMonthlyCost('warehouse', archiveableSize) -
              this.estimateMonthlyCost('archive', archiveableSize),
          });
        }
      }
    }

    return optimizations;
  }

  /**
   * Check if data movement is needed
   */
  checkMovementNeeded(
    tier: StorageTier,
    recordAge: Date,
  ): { needsMovement: boolean; destinationTier?: StorageTier } {
    const policy = this.MOVEMENT_POLICIES.find(p => p.sourceTier === tier && p.enabled);
    if (!policy) {
      return { needsMovement: false };
    }

    const daysSinceCreation = Math.floor(
      (Date.now() - recordAge.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation >= policy.triggerDays) {
      return {
        needsMovement: true,
        destinationTier: policy.destinationTier,
      };
    }

    return { needsMovement: false };
  }

  /**
   * Get storage tier summary
   */
  getStorageSummary(metrics: StorageMetrics[]): {
    totalRecords: number;
    totalSizeGB: number;
    totalMonthlyCost: number;
    tierBreakdown: Array<{
      tier: StorageTier;
      percentage: number;
      cost: number;
    }>;
  } {
    const totalRecords = metrics.reduce((sum, m) => sum + m.totalRecords, 0);
    const totalSizeGB = metrics.reduce((sum, m) => sum + m.totalSizeGB, 0);
    const totalMonthlyCost = this.estimateTotalMonthlyCost(metrics);

    const tierBreakdown = metrics.map(m => ({
      tier: m.tier,
      percentage: totalRecords > 0 ? (m.totalRecords / totalRecords) * 100 : 0,
      cost: m.estimatedMonthlyCost,
    }));

    return {
      totalRecords,
      totalSizeGB,
      totalMonthlyCost,
      tierBreakdown,
    };
  }
}

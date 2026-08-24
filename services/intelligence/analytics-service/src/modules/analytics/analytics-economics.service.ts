import { Injectable } from '@nestjs/common';

// ============================================================================
// Analytics Economics (TAA §88)
//
// Tracks event volume, costs, and prevents unbounded telemetry cardinality
// to ensure analytics infrastructure remains cost-effective.
// ============================================================================

export interface EventVolumeMetrics {
  domain: string;
  eventName: string;
  hourlyVolume: number;
  dailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  costPerMillion: number;
  totalCost: number;
  measuredAt: Date;
}

export interface CostTrackingMetrics {
  domain: string;
  period: string;
  totalEvents: number;
  totalCost: number;
  costPerMillion: number;
  storageCost: number;
  computeCost: number;
  networkCost: number;
  breakdownByTier: {
    hot: number;
    warehouse: number;
    archive: number;
  };
}

export interface CardinalityMetrics {
  eventName: string;
  cardinality: number; // Number of unique values for a field
  field: string;
  threshold: number;
  isExceeded: boolean;
  topValues: Array<{ value: string; count: number }>;
}

export interface VolumeAlert {
  domain: string;
  eventName: string;
  currentVolume: number;
  expectedVolume: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  description: string;
}

@Injectable()
export class AnalyticsEconomicsService {
  // Cost per million events (approximate)
  private readonly COST_PER_MILLION = {
    ingestion: 0.5,
    storage_hot: 0.1,
    storage_warehouse: 0.02,
    storage_archive: 0.004,
    compute: 0.25,
    network: 0.05,
  };

  // Cardinality thresholds per field
  private readonly CARDINALITY_THRESHOLDS: Record<string, number> = {
    userId: 1000000, // 1M unique users
    sessionId: 10000000, // 10M unique sessions
    contentId: 100000, // 100K unique content items
    platform: 10, // web, ios, android, etc.
    universe: 20, // 20 universes max
    eventType: 100, // 100 event types max
    country: 250, // 250 countries max
    deviceType: 20, // 20 device types max
  };

  /**
   * Calculate cost per million events
   */
  calculateCostPerMillion(
    _events: number,
    storageTier: 'hot' | 'warehouse' | 'archive' = 'hot'
  ): number {
    const storageKey = `storage_${storageTier}` as keyof typeof this.COST_PER_MILLION;
    return (
      this.COST_PER_MILLION.ingestion +
      this.COST_PER_MILLION[storageKey] +
      this.COST_PER_MILLION.compute +
      this.COST_PER_MILLION.network
    );
  }

  /**
   * Calculate total cost for events
   */
  calculateTotalCost(
    events: number,
    storageDays: number,
    storageTier: 'hot' | 'warehouse' | 'archive' = 'hot'
  ): {
    ingestionCost: number;
    storageCost: number;
    computeCost: number;
    networkCost: number;
    totalCost: number;
  } {
    const ingestionCost = (events / 1000000) * this.COST_PER_MILLION.ingestion;

    const storageKey = `storage_${storageTier}` as keyof typeof this.COST_PER_MILLION;
    const storageCost = (events / 1000000) * this.COST_PER_MILLION[storageKey] * (storageDays / 30);

    const computeCost = (events / 1000000) * this.COST_PER_MILLION.compute;
    const networkCost = (events / 1000000) * this.COST_PER_MILLION.network;

    return {
      ingestionCost: Math.round(ingestionCost * 100) / 100,
      storageCost: Math.round(storageCost * 100) / 100,
      computeCost: Math.round(computeCost * 100) / 100,
      networkCost: Math.round(networkCost * 100) / 100,
      totalCost: Math.round((ingestionCost + storageCost + computeCost + networkCost) * 100) / 100,
    };
  }

  /**
   * Track event volume per domain
   */
  trackVolume(domain: string, eventName: string, hourlyVolume: number): EventVolumeMetrics {
    const dailyVolume = hourlyVolume * 24;
    const weeklyVolume = dailyVolume * 7;
    const monthlyVolume = dailyVolume * 30;

    const cpm = this.calculateCostPerMillion(monthlyVolume);
    const totalCost = (monthlyVolume / 1000000) * cpm;

    return {
      domain,
      eventName,
      hourlyVolume,
      dailyVolume,
      weeklyVolume,
      monthlyVolume,
      costPerMillion: Math.round(cpm * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      measuredAt: new Date(),
    };
  }

  /**
   * Check cardinality for a field
   */
  checkCardinality(
    eventName: string,
    field: string,
    uniqueValues: Map<string, number>
  ): CardinalityMetrics {
    const cardinality = uniqueValues.size;
    const threshold = this.CARDINALITY_THRESHOLDS[field] || 10000;

    // Get top values
    const sortedValues = Array.from(uniqueValues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));

    return {
      eventName,
      cardinality,
      field,
      threshold,
      isExceeded: cardinality > threshold,
      topValues: sortedValues,
    };
  }

  /**
   * Detect volume anomalies
   */
  detectVolumeAnomalies(
    metrics: EventVolumeMetrics[],
    historicalAverage: Map<string, number>,
    thresholdStandardDeviations: number = 2
  ): VolumeAlert[] {
    const alerts: VolumeAlert[] = [];

    for (const metric of metrics) {
      const key = `${metric.domain}:${metric.eventName}`;
      const avg = historicalAverage.get(key);

      if (avg === undefined || avg === 0) continue;

      const deviation = (metric.dailyVolume - avg) / avg;
      const absDeviation = Math.abs(deviation);

      if (absDeviation > thresholdStandardDeviations) {
        let severity: VolumeAlert['severity'];
        if (absDeviation > 4) severity = 'critical';
        else if (absDeviation > 3) severity = 'high';
        else if (absDeviation > 2.5) severity = 'medium';
        else severity = 'low';

        alerts.push({
          domain: metric.domain,
          eventName: metric.eventName,
          currentVolume: metric.dailyVolume,
          expectedVolume: avg,
          deviation: Math.round(deviation * 100) / 100,
          severity,
          detectedAt: new Date(),
          description:
            deviation > 0
              ? `${metric.eventName} volume is ${Math.round(deviation * 100)}% above average`
              : `${metric.eventName} volume is ${Math.round(Math.abs(deviation) * 100)}% below average`,
        });
      }
    }

    return alerts;
  }

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizations(
    volumes: EventVolumeMetrics[],
    cardinalities: CardinalityMetrics[]
  ): Array<{
    type: 'volume' | 'cardinality' | 'storage';
    recommendation: string;
    estimatedSavings: number;
  }> {
    const recommendations: Array<{
      type: 'volume' | 'cardinality' | 'storage';
      recommendation: string;
      estimatedSavings: number;
    }> = [];

    // Check for high-volume events that could be sampled
    for (const vol of volumes) {
      if (vol.hourlyVolume > 100000) {
        const samplingSavings = vol.totalCost * 0.5; // 50% savings with 50% sampling
        recommendations.push({
          type: 'volume',
          recommendation: `${vol.eventName} has ${vol.hourlyVolume.toLocaleString()} events/hour. Consider client-side sampling.`,
          estimatedSavings: Math.round(samplingSavings * 100) / 100,
        });
      }
    }

    // Check for high cardinality fields
    for (const card of cardinalities) {
      if (card.isExceeded) {
        recommendations.push({
          type: 'cardinality',
          recommendation: `${card.field} in ${card.eventName} has cardinality ${card.cardinality} (threshold: ${card.threshold}). Consider bucketing or limiting values.`,
          estimatedSavings: 0, // Hard to estimate
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate economics report
   */
  generateEconomicsReport(
    volumes: EventVolumeMetrics[],
    cardinalities: CardinalityMetrics[]
  ): {
    totalMonthlyEvents: number;
    totalMonthlyCost: number;
    costPerMillion: number;
    topExpensiveEvents: EventVolumeMetrics[];
    cardinalityAlerts: CardinalityMetrics[];
    recommendations: Array<{
      type: string;
      recommendation: string;
      estimatedSavings: number;
    }>;
  } {
    const totalMonthlyEvents = volumes.reduce((sum, v) => sum + v.monthlyVolume, 0);
    const totalMonthlyCost = volumes.reduce((sum, v) => sum + v.totalCost, 0);
    const costPerMillion =
      totalMonthlyEvents > 0 ? (totalMonthlyCost / totalMonthlyEvents) * 1000000 : 0;

    const topExpensiveEvents = [...volumes].sort((a, b) => b.totalCost - a.totalCost).slice(0, 10);

    const cardinalityAlerts = cardinalities.filter((c) => c.isExceeded);

    const recommendations = this.getCostOptimizations(volumes, cardinalities);

    return {
      totalMonthlyEvents,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      costPerMillion: Math.round(costPerMillion * 100) / 100,
      topExpensiveEvents,
      cardinalityAlerts,
      recommendations,
    };
  }
}

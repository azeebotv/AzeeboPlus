import { Injectable } from '@nestjs/common';

// ============================================================================
// Analytics QA Monitoring (AZP-AN-005, TAA §88)
//
// Monitors event quality, completeness, latency, and anomalies
// to ensure analytics data is reliable and actionable.
// ============================================================================

export interface EventQualityScore {
  eventName: string;
  completeness: number; // 0-100, % of required fields present
  timeliness: number; // 0-100, % of events within latency threshold
  accuracy: number; // 0-100, % of events passing validation
  overall: number; // Weighted average
  sampleSize: number;
  measuredAt: Date;
}

export interface EventLatencyMetrics {
  eventName: string;
  p50: number; // ms
  p95: number; // ms
  p99: number; // ms;
  avg: number;
  max: number;
  sampleCount: number;
}

export interface EventCompletenessMetrics {
  eventName: string;
  totalEvents: number;
  completeEvents: number;
  missingFields: Array<{
    field: string;
    missingCount: number;
    missingPercentage: number;
  }>;
  completenessScore: number; // 0-100
}

export interface AnomalyDetectionResult {
  eventName: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  description: string;
}

export interface EventVolumeMetrics {
  eventName: string;
  currentHour: number;
  previousHour: number;
  sameDayLastWeek: number;
  hourlyAverage7d: number;
  deviationFromAverage: number;
  isAnomaly: boolean;
}

@Injectable()
export class EventQAService {
  // Latency thresholds per event type (ms)
  private readonly LATENCY_THRESHOLDS: Record<string, number> = {
    screen_view: 1000,
    content_impression: 1500,
    content_click: 1000,
    play_start: 2000,
    play_complete: 1500,
    payment_success: 3000,
    search_query: 1500,
    default: 1500,
  };

  // Required fields per event type
  private readonly REQUIRED_FIELDS: Record<string, string[]> = {
    screen_view: ['session_id', 'platform', 'timestamp', 'screen_name'],
    content_impression: ['session_id', 'platform', 'timestamp', 'content_id'],
    content_click: ['session_id', 'platform', 'timestamp', 'content_id'],
    play_start: ['session_id', 'platform', 'timestamp', 'content_id', 'universe'],
    play_complete: ['session_id', 'platform', 'timestamp', 'content_id', 'duration'],
    payment_success: ['session_id', 'platform', 'timestamp', 'amount', 'currency'],
    search_query: ['session_id', 'platform', 'timestamp', 'query'],
    default: ['session_id', 'platform', 'timestamp'],
  };

  /**
   * Calculate event quality score
   */
  calculateQualityScore(
    eventName: string,
    completeness: number,
    timeliness: number,
    accuracy: number,
    sampleSize: number
  ): EventQualityScore {
    // Weighted average: completeness 40%, timeliness 30%, accuracy 30%
    const overall = completeness * 0.4 + timeliness * 0.3 + accuracy * 0.3;

    return {
      eventName,
      completeness: Math.round(completeness * 100) / 100,
      timeliness: Math.round(timeliness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      overall: Math.round(overall * 100) / 100,
      sampleSize,
      measuredAt: new Date(),
    };
  }

  /**
   * Calculate event completeness metrics
   */
  calculateCompleteness(
    eventName: string,
    events: Array<Record<string, unknown>>
  ): EventCompletenessMetrics {
    const requiredFields = this.REQUIRED_FIELDS[eventName] || this.REQUIRED_FIELDS.default;
    const totalEvents = events.length;

    if (totalEvents === 0) {
      return {
        eventName,
        totalEvents: 0,
        completeEvents: 0,
        missingFields: [],
        completenessScore: 100,
      };
    }

    const missingCounts = new Map<string, number>();

    for (const field of requiredFields) {
      let missingCount = 0;
      for (const event of events) {
        if (event[field] === undefined || event[field] === null || event[field] === '') {
          missingCount++;
        }
      }
      if (missingCount > 0) {
        missingCounts.set(field, missingCount);
      }
    }

    const totalMissing = Array.from(missingCounts.values()).reduce((a, b) => a + b, 0);
    const totalRequired = totalEvents * requiredFields.length;
    const completenessScore =
      totalRequired > 0 ? ((totalRequired - totalMissing) / totalRequired) * 100 : 100;

    return {
      eventName,
      totalEvents,
      completeEvents:
        totalEvents - (missingCounts.size > 0 ? Math.max(...missingCounts.values()) : 0),
      missingFields: Array.from(missingCounts.entries()).map(([field, count]) => ({
        field,
        missingCount: count,
        missingPercentage: (count / totalEvents) * 100,
      })),
      completenessScore: Math.round(completenessScore * 100) / 100,
    };
  }

  /**
   * Calculate event latency metrics
   */
  calculateLatency(
    eventName: string,
    latencies: number[] // in milliseconds
  ): EventLatencyMetrics {
    if (latencies.length === 0) {
      return {
        eventName,
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        max: 0,
        sampleCount: 0,
      };
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const len = sorted.length;

    const p50 = sorted[Math.floor(len * 0.5)];
    const p95 = sorted[Math.floor(len * 0.95)];
    const p99 = sorted[Math.floor(len * 0.99)];
    const avg = latencies.reduce((a, b) => a + b, 0) / len;
    const max = sorted[len - 1];

    return {
      eventName,
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      avg: Math.round(avg),
      max: Math.round(max),
      sampleCount: len,
    };
  }

  /**
   * Detect anomalies in event volume
   */
  detectAnomalies(
    metrics: EventVolumeMetrics[],
    standardDeviations: number = 2
  ): AnomalyDetectionResult[] {
    const anomalies: AnomalyDetectionResult[] = [];

    for (const metric of metrics) {
      if (metric.hourlyAverage7d === 0) continue;

      const deviation = (metric.currentHour - metric.hourlyAverage7d) / metric.hourlyAverage7d;
      const absDeviation = Math.abs(deviation);

      if (absDeviation > standardDeviations) {
        let severity: AnomalyDetectionResult['severity'];
        if (absDeviation > 4) severity = 'critical';
        else if (absDeviation > 3) severity = 'high';
        else if (absDeviation > 2.5) severity = 'medium';
        else severity = 'low';

        anomalies.push({
          eventName: metric.eventName,
          metric: 'hourly_volume',
          currentValue: metric.currentHour,
          expectedValue: metric.hourlyAverage7d,
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

    return anomalies;
  }

  /**
   * Get latency threshold for an event type
   */
  getLatencyThreshold(eventName: string): number {
    return this.LATENCY_THRESHOLDS[eventName] || this.LATENCY_THRESHOLDS.default;
  }

  /**
   * Check if latency is within threshold
   */
  isLatencyWithinThreshold(eventName: string, latencyMs: number): boolean {
    return latencyMs <= this.getLatencyThreshold(eventName);
  }

  /**
   * Calculate timeliness score (% of events within latency threshold)
   */
  calculateTimelinessScore(eventName: string, latencies: number[]): number {
    if (latencies.length === 0) return 100;

    const threshold = this.getLatencyThreshold(eventName);
    const withinThreshold = latencies.filter((l) => l <= threshold).length;
    return (withinThreshold / latencies.length) * 100;
  }

  /**
   * Generate QA report for a set of events
   */
  generateQAReport(
    eventName: string,
    events: Array<Record<string, unknown>>,
    latencies: number[]
  ): {
    qualityScore: EventQualityScore;
    completeness: EventCompletenessMetrics;
    latency: EventLatencyMetrics;
    timelinessScore: number;
  } {
    const completeness = this.calculateCompleteness(eventName, events);
    const latency = this.calculateLatency(eventName, latencies);
    const timelinessScore = this.calculateTimelinessScore(eventName, latencies);

    // Accuracy is based on completeness for now
    const accuracyScore = completeness.completenessScore;

    const qualityScore = this.calculateQualityScore(
      eventName,
      completeness.completenessScore,
      timelinessScore,
      accuracyScore,
      events.length
    );

    return {
      qualityScore,
      completeness,
      latency,
      timelinessScore: Math.round(timelinessScore * 100) / 100,
    };
  }
}

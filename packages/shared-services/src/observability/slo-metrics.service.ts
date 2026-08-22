/**
 * SLO Metrics Service (TAA §57, §61)
 *
 * Tracks Service Level Objectives:
 * - Availability SLOs (99.9% monthly)
 * - Latency SLOs (P50, P95, P99)
 * - Error budget consumption
 * - SLO burn rate alerting
 */

export interface SLODefinition {
  /** SLO identifier */
  id: string;
  /** SLO name */
  name: string;
  /** SLO description */
  description: string;
  /** Target value (e.g., 99.9 for availability) */
  target: number;
  /** SLO type */
  type: 'availability' | 'latency' | 'error_rate' | 'throughput';
  /** Window period in days */
  windowDays: number;
  /** Service this SLO applies to */
  service: string;
}

export interface SLOMeasurement {
  /** SLO ID */
  sloId: string;
  /** Measurement timestamp */
  timestamp: Date;
  /** Measured value */
  value: number;
  /** Total requests/samples */
  totalSamples: number;
  /** Good requests/samples */
  goodSamples: number;
  /** Bad requests/samples */
  badSamples: number;
}

export interface SLOStatus {
  /** SLO definition */
  slo: SLODefinition;
  /** Current SLO value */
  currentValue: number;
  /** Whether SLO is being met */
  isMet: boolean;
  /** Error budget remaining (percentage) */
  errorBudgetRemaining: number;
  /** Error budget consumed (percentage) */
  errorBudgetConsumed: number;
  /** Burn rate (1 = on track, >1 = consuming budget faster) */
  burnRate: number;
  /** Time window start */
  windowStart: Date;
  /** Time window end */
  windowEnd: Date;
}

export interface SLOAlert {
  /** Alert ID */
  id: string;
  /** SLO ID */
  sloId: string;
  /** Alert severity */
  severity: 'critical' | 'warning' | 'info';
  /** Alert message */
  message: string;
  /** Current burn rate */
  burnRate: number;
  /** Error budget remaining */
  errorBudgetRemaining: number;
  /** Timestamp */
  timestamp: Date;
  /** Whether alert is acknowledged */
  acknowledged: boolean;
}

/** Default SLO definitions for the platform */
export const DEFAULT_SLOS: SLODefinition[] = [
  {
    id: 'auth-availability',
    name: 'Auth Service Availability',
    description: 'Authentication service should be available 99.9% of the time',
    target: 99.9,
    type: 'availability',
    windowDays: 30,
    service: 'auth-service',
  },
  {
    id: 'content-availability',
    name: 'Content Service Availability',
    description: 'Content service should be available 99.9% of the time',
    target: 99.9,
    type: 'availability',
    windowDays: 30,
    service: 'content-service',
  },
  {
    id: 'api-latency-p95',
    name: 'API Latency P95',
    description: 'Critical non-media API P95 latency should be ≤750ms',
    target: 750,
    type: 'latency',
    windowDays: 30,
    service: 'api-gateway',
  },
  {
    id: 'api-latency-p99',
    name: 'API Latency P99',
    description: 'Critical non-media API P99 latency should be ≤1,500ms',
    target: 1500,
    type: 'latency',
    windowDays: 30,
    service: 'api-gateway',
  },
  {
    id: 'search-latency-p95',
    name: 'Search Latency P95',
    description: 'Search P95 latency should be ≤1.5s',
    target: 1500,
    type: 'latency',
    windowDays: 30,
    service: 'search-service',
  },
  {
    id: 'playback-startup-p50',
    name: 'Playback Startup P50',
    description: 'Playback startup P50 should be ≤2.5s',
    target: 2500,
    type: 'latency',
    windowDays: 30,
    service: 'media-service',
  },
  {
    id: 'playback-startup-p95',
    name: 'Playback Startup P95',
    description: 'Playback startup P95 should be ≤6s',
    target: 6000,
    type: 'latency',
    windowDays: 30,
    service: 'media-service',
  },
  {
    id: 'rebuffer-ratio',
    name: 'Rebuffer Ratio',
    description: 'Rebuffer ratio P95 should be <2% of playback time',
    target: 2,
    type: 'error_rate',
    windowDays: 30,
    service: 'media-service',
  },
  {
    id: 'entitlement-propagation',
    name: 'Entitlement Propagation',
    description: 'Entitlement propagation should complete within 10s for 99%',
    target: 10000,
    type: 'latency',
    windowDays: 30,
    service: 'entitlement-service',
  },
  {
    id: 'notification-delivery',
    name: 'Notification Delivery',
    description: '95% of notifications should be provider-accepted within 15 min',
    target: 95,
    type: 'availability',
    windowDays: 30,
    service: 'notification-service',
  },
];

export class SLOMetricsService {
  private readonly sloDefinitions: Map<string, SLODefinition> = new Map();
  private readonly measurements: Map<string, SLOMeasurement[]> = new Map();
  private readonly alerts: SLOAlert[] = [];

  constructor(sloDefinitions?: SLODefinition[]) {
    const definitions = sloDefinitions || DEFAULT_SLOS;
    for (const slo of definitions) {
      this.sloDefinitions.set(slo.id, slo);
      this.measurements.set(slo.id, []);
    }
  }

  /**
   * Record a measurement for an SLO
   */
  recordMeasurement(sloId: string, value: number, totalSamples: number, goodSamples: number): void {
    const measurements = this.measurements.get(sloId) || [];
    measurements.push({
      sloId,
      timestamp: new Date(),
      value,
      totalSamples,
      goodSamples,
      badSamples: totalSamples - goodSamples,
    });

    // Keep only last 30 days of measurements
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filtered = measurements.filter((m) => m.timestamp >= thirtyDaysAgo);
    this.measurements.set(sloId, filtered);

    // Check for SLO violations
    this.checkSLOViolation(sloId, value);
  }

  /**
   * Get current SLO status
   */
  getSLOStatus(sloId: string): SLOStatus | null {
    const slo = this.sloDefinitions.get(sloId);
    if (!slo) return null;

    const measurements = this.measurements.get(sloId) || [];
    const windowStart = new Date(Date.now() - slo.windowDays * 24 * 60 * 60 * 1000);
    const windowMeasurements = measurements.filter((m) => m.timestamp >= windowStart);

    if (windowMeasurements.length === 0) {
      return {
        slo,
        currentValue: 100,
        isMet: true,
        errorBudgetRemaining: 100,
        errorBudgetConsumed: 0,
        burnRate: 0,
        windowStart,
        windowEnd: new Date(),
      };
    }

    // Calculate current value based on SLO type
    let currentValue: number;
    if (slo.type === 'availability') {
      const total = windowMeasurements.reduce((sum, m) => sum + m.totalSamples, 0);
      const good = windowMeasurements.reduce((sum, m) => sum + m.goodSamples, 0);
      currentValue = total > 0 ? (good / total) * 100 : 100;
    } else if (slo.type === 'latency') {
      const values = windowMeasurements.map((m) => m.value);
      values.sort((a, b) => a - b);
      const p95Index = Math.floor(values.length * 0.95);
      currentValue = values[p95Index] || 0;
    } else {
      currentValue = windowMeasurements[windowMeasurements.length - 1]?.value || 100;
    }

    const isMet = slo.type === 'latency' ? currentValue <= slo.target : currentValue >= slo.target;

    // Calculate error budget
    const errorBudgetConsumed =
      slo.type === 'latency'
        ? (Math.max(0, currentValue - slo.target) / slo.target) * 100
        : (Math.max(0, slo.target - currentValue) / (100 - slo.target)) * 100;
    const errorBudgetRemaining = Math.max(0, 100 - errorBudgetConsumed);

    // Calculate burn rate
    const burnRate = this.calculateBurnRate(sloId, windowStart);

    return {
      slo,
      currentValue: Math.round(currentValue * 100) / 100,
      isMet,
      errorBudgetRemaining: Math.round(errorBudgetRemaining * 100) / 100,
      errorBudgetConsumed: Math.round(errorBudgetConsumed * 100) / 100,
      burnRate: Math.round(burnRate * 100) / 100,
      windowStart,
      windowEnd: new Date(),
    };
  }

  /**
   * Get all SLO statuses
   */
  getAllSLOStatuses(): SLOStatus[] {
    return Array.from(this.sloDefinitions.keys())
      .map((id) => this.getSLOStatus(id))
      .filter((status): status is SLOStatus => status !== null);
  }

  /**
   * Calculate burn rate for an SLO
   */
  private calculateBurnRate(sloId: string, windowStart: Date): number {
    const measurements = this.measurements.get(sloId) || [];
    const windowMeasurements = measurements.filter((m) => m.timestamp >= windowStart);

    if (windowMeasurements.length < 2) return 1;

    // Compare last hour vs window average
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMeasurements = windowMeasurements.filter((m) => m.timestamp >= oneHourAgo);

    if (recentMeasurements.length === 0) return 1;

    const recentValue =
      recentMeasurements.reduce((sum, m) => sum + m.value, 0) / recentMeasurements.length;
    const windowValue =
      windowMeasurements.reduce((sum, m) => sum + m.value, 0) / windowMeasurements.length;

    if (windowValue === 0) return 1;

    return recentValue / windowValue;
  }

  /**
   * Check for SLO violations and create alerts
   */
  private checkSLOViolation(sloId: string, _value: number): void {
    const slo = this.sloDefinitions.get(sloId);
    if (!slo) return;

    const status = this.getSLOStatus(sloId);
    if (!status) return;

    // Check burn rate thresholds
    if (status.burnRate > 14.4) {
      // 2% budget consumed in 1 hour
      this.createAlert(
        sloId,
        'critical',
        `SLO ${slo.name} burn rate critical: ${status.burnRate}x`
      );
    } else if (status.burnRate > 6) {
      // 5% budget consumed in 6 hours
      this.createAlert(sloId, 'warning', `SLO ${slo.name} burn rate warning: ${status.burnRate}x`);
    }

    // Check error budget exhaustion
    if (status.errorBudgetRemaining <= 0) {
      this.createAlert(sloId, 'critical', `SLO ${slo.name} error budget exhausted`);
    } else if (status.errorBudgetRemaining < 10) {
      this.createAlert(
        sloId,
        'warning',
        `SLO ${slo.name} error budget low: ${status.errorBudgetRemaining}% remaining`
      );
    }
  }

  /**
   * Create an alert
   */
  private createAlert(sloId: string, severity: SLOAlert['severity'], message: string): void {
    const status = this.getSLOStatus(sloId);
    if (!status) return;

    const alert: SLOAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sloId,
      severity,
      message,
      burnRate: status.burnRate,
      errorBudgetRemaining: status.errorBudgetRemaining,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SLOAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Check if releases should be frozen
   */
  shouldFreezeReleases(): { freeze: boolean; reason: string } {
    const statuses = this.getAllSLOStatuses();

    for (const status of statuses) {
      if (status.errorBudgetRemaining <= 0) {
        return {
          freeze: true,
          reason: `SLO ${status.slo.name} error budget exhausted - releases frozen`,
        };
      }
    }

    return { freeze: false, reason: '' };
  }

  /**
   * Get SLO summary
   */
  getSummary(): {
    totalSLOs: number;
    meetingTarget: number;
    violatingTarget: number;
    averageErrorBudget: number;
    activeAlerts: number;
  } {
    const statuses = this.getAllSLOStatuses();
    const meetingTarget = statuses.filter((s) => s.isMet).length;
    const averageErrorBudget =
      statuses.reduce((sum, s) => sum + s.errorBudgetRemaining, 0) / statuses.length;

    return {
      totalSLOs: statuses.length,
      meetingTarget,
      violatingTarget: statuses.length - meetingTarget,
      averageErrorBudget: Math.round(averageErrorBudget * 100) / 100,
      activeAlerts: this.getActiveAlerts().length,
    };
  }
}

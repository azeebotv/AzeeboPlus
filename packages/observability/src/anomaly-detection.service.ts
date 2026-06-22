import { Injectable, Logger } from '@nestjs/common';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  window: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  cooldown: number;
}

export interface AlertEvent {
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  severity: string;
  service?: string;
}

export interface MetricSample {
  metric: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger('AnomalyDetection');
  private readonly rules: Map<string, AlertRule> = new Map();
  private readonly metricHistory: Map<string, MetricSample[]> = new Map();
  private readonly lastAlertTime: Map<string, number> = new Map();
  private readonly alertCallbacks: Array<(alert: AlertEvent) => void> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        threshold: 5,
        operator: 'gt',
        window: 300000,
        severity: 'critical',
        enabled: true,
        cooldown: 300000,
      },
      {
        id: 'high-latency',
        name: 'High Latency',
        metric: 'response_time_p95',
        threshold: 500,
        operator: 'gt',
        window: 300000,
        severity: 'high',
        enabled: true,
        cooldown: 300000,
      },
      {
        id: 'high-memory',
        name: 'High Memory Usage',
        metric: 'memory_usage_percent',
        threshold: 80,
        operator: 'gt',
        window: 60000,
        severity: 'high',
        enabled: true,
        cooldown: 600000,
      },
      {
        id: 'high-cpu',
        name: 'High CPU Usage',
        metric: 'cpu_usage_percent',
        threshold: 90,
        operator: 'gt',
        window: 60000,
        severity: 'medium',
        enabled: true,
        cooldown: 300000,
      },
      {
        id: 'payment-failure-spike',
        name: 'Payment Failure Spike',
        metric: 'payment_failure_rate',
        threshold: 10,
        operator: 'gt',
        window: 300000,
        severity: 'critical',
        enabled: true,
        cooldown: 600000,
      },
      {
        id: 'auth-failure-spike',
        name: 'Authentication Failure Spike',
        metric: 'auth_failure_rate',
        threshold: 20,
        operator: 'gt',
        window: 300000,
        severity: 'high',
        enabled: true,
        cooldown: 300000,
      },
      {
        id: 'low-throughput',
        name: 'Low Throughput',
        metric: 'requests_per_second',
        threshold: 1,
        operator: 'lt',
        window: 300000,
        severity: 'medium',
        enabled: true,
        cooldown: 600000,
      },
      {
        id: 'queue-backlog',
        name: 'Queue Backlog',
        metric: 'queue_depth',
        threshold: 1000,
        operator: 'gt',
        window: 60000,
        severity: 'high',
        enabled: true,
        cooldown: 300000,
      },
    ];

    defaultRules.forEach((rule) => this.addRule(rule));
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.log(`Added alert rule: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.logger.log(`Removed alert rule: ${ruleId}`);
  }

  recordMetric(sample: MetricSample): void {
    const history = this.metricHistory.get(sample.metric) || [];
    history.push(sample);

    const windowStart = Date.now() - 5 * 60 * 1000;
    const filteredHistory = history.filter((s) => s.timestamp.getTime() > windowStart);
    this.metricHistory.set(sample.metric, filteredHistory);

    this.evaluateRules(sample);
  }

  private evaluateRules(sample: MetricSample): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.metric !== sample.metric) {
        continue;
      }

      const lastAlertTime = this.lastAlertTime.get(rule.id) || 0;
      if (Date.now() - lastAlertTime < rule.cooldown) {
        continue;
      }

      const history = this.metricHistory.get(rule.metric) || [];
      const windowSamples = history.filter((s) => s.timestamp.getTime() > Date.now() - rule.window);

      if (windowSamples.length === 0) {
        continue;
      }

      const avgValue = windowSamples.reduce((sum, s) => sum + s.value, 0) / windowSamples.length;

      if (this.checkThreshold(avgValue, rule.operator, rule.threshold)) {
        this.triggerAlert(rule, avgValue, sample.tags?.service);
      }
    }
  }

  private checkThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, value: number, service?: string): void {
    this.lastAlertTime.set(rule.id, Date.now());

    const alert: AlertEvent = {
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      timestamp: new Date(),
      severity: rule.severity,
      service,
    };

    this.logger.warn(
      `ALERT [${rule.severity.toUpperCase()}]: ${rule.name} - Value: ${value.toFixed(2)}, Threshold: ${rule.threshold}`
    );

    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        this.logger.error(`Alert callback failed: ${error}`);
      }
    }
  }

  onAlert(callback: (alert: AlertEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  getAlertHistory(metric: string, windowMs: number = 3600000): AlertEvent[] {
    const history = this.metricHistory.get(metric) || [];
    const cutoff = Date.now() - windowMs;
    return history
      .filter((s) => s.timestamp.getTime() > cutoff)
      .map((s) => ({
        ruleId: 'manual',
        ruleName: 'Manual Check',
        metric: s.metric,
        value: s.value,
        threshold: 0,
        timestamp: s.timestamp,
        severity: 'info',
        service: s.tags?.service,
      }));
  }

  getMetricStats(
    metric: string,
    windowMs: number = 3600000
  ): {
    avg: number;
    min: number;
    max: number;
    p95: number;
    count: number;
  } | null {
    const history = this.metricHistory.get(metric) || [];
    const cutoff = Date.now() - windowMs;
    const samples = history.filter((s) => s.timestamp.getTime() > cutoff).map((s) => s.value);

    if (samples.length === 0) {
      return null;
    }

    samples.sort((a, b) => a - b);

    return {
      avg: samples.reduce((sum, v) => sum + v, 0) / samples.length,
      min: samples[0],
      max: samples[samples.length - 1],
      p95: samples[Math.floor(samples.length * 0.95)],
      count: samples.length,
    };
  }
}

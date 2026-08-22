/**
 * Alerting Rules Configuration
 * OBS-002: Configure alerting rules
 */

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  channel: string;
  runbookUrl?: string;
}

export const ALERTING_RULES: AlertRule[] = [
  {
    name: 'high_error_rate',
    condition: 'error_rate > threshold',
    threshold: 0.05,
    duration: '5m',
    severity: 'critical',
    channel: 'slack-critical',
    runbookUrl: 'https://runbooks.azeeboplus.com/high-error-rate',
  },
  {
    name: 'high_latency_p99',
    condition: 'latency_p99 > threshold',
    threshold: 2000,
    duration: '5m',
    severity: 'warning',
    channel: 'slack-warning',
  },
  {
    name: 'database_connection_pool_exhausted',
    condition: 'db_pool_usage > threshold',
    threshold: 0.9,
    duration: '2m',
    severity: 'critical',
    channel: 'slack-critical',
  },
  {
    name: 'redis_memory_high',
    condition: 'redis_memory_usage > threshold',
    threshold: 0.85,
    duration: '10m',
    severity: 'warning',
    channel: 'slack-warning',
  },
  {
    name: 'payment_failure_rate',
    condition: 'payment_failure_rate > threshold',
    threshold: 0.1,
    duration: '5m',
    severity: 'critical',
    channel: 'slack-critical',
  },
  {
    name: 'service_down',
    condition: 'health_check_failed',
    threshold: 1,
    duration: '1m',
    severity: 'critical',
    channel: 'pagerduty-critical',
  },
  {
    name: 'slo_burn_rate_critical',
    condition: 'slo_burn_rate > threshold',
    threshold: 14.4,
    duration: '1h',
    severity: 'critical',
    channel: 'pagerduty-critical',
  },
  {
    name: 'slo_burn_rate_warning',
    condition: 'slo_burn_rate > threshold',
    threshold: 6,
    duration: '6h',
    severity: 'warning',
    channel: 'slack-warning',
  },
];

export function getAlertRulesBySeverity(severity: AlertRule['severity']): AlertRule[] {
  return ALERTING_RULES.filter(rule => rule.severity === severity);
}

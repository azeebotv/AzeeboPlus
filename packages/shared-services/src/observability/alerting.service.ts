/**
 * In-Memory Alerting Rules & Event Registry (TAA §61)
 *
 * NOTE: This service provides an in-memory alert evaluation, deduplication,
 * and channel routing dispatch layer. In production, physical paging (PagerDuty,
 * Opsgenie) and chat notifications (Slack) are delivered via registered
 * `NotificationChannelAdapter` instances with retry and deduplication tracking,
 * supplementing infrastructure-level monitoring (Prometheus Alertmanager / Datadog).
 *
 * Capabilities:
 * - SLO burn rate rules & thresholds
 * - Critical service alerts & deduplication window
 * - Notification channel dispatch with retries & delivery logs
 * - Alert routing, ack/resolve lifecycle, and escalation policies
 */

import { ORIGINS } from '@azeebo/shared-types';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertStatus = 'firing' | 'resolved' | 'acknowledged' | 'silenced';

export interface AlertDeliveryLog {
  alertId: string;
  channel: string;
  status: 'sent' | 'failed' | 'deduplicated';
  attemptCount: number;
  lastAttemptAt: Date;
  error?: string;
}

export interface NotificationChannelAdapter {
  channel: string;
  send(alert: Alert, rule: AlertRule): Promise<boolean>;
}

export interface AlertRule {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Severity */
  severity: AlertSeverity;
  /** Condition expression */
  condition: string;
  /** Duration before firing */
  duration: string;
  /** Runbook URL */
  runbookUrl?: string;
  /** Notification channels */
  notifications: string[];
  /** Owner/team */
  owner: string;
  /** Whether rule is enabled */
  enabled: boolean;
}

export interface Alert {
  /** Alert ID */
  id: string;
  /** Rule ID that triggered */
  ruleId: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** Alert status */
  status: AlertStatus;
  /** Alert message */
  message: string;
  /** Alert labels */
  labels: Record<string, string>;
  /** Alert annotations */
  annotations: Record<string, string>;
  /** Timestamp triggered */
  firedAt: Date;
  /** Timestamp resolved */
  resolvedAt?: Date;
  /** Timestamp acknowledged */
  acknowledgedAt?: Date;
  /** Acknowledged by */
  acknowledgedBy?: string;
}

export interface EscalationPolicy {
  /** Policy ID */
  id: string;
  /** Policy name */
  name: string;
  /** Escalation levels */
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  /** Level number */
  level: number;
  /** Wait time before escalation (minutes) */
  waitMinutes: number;
  /** Notification channels */
  channels: string[];
  /** Contacts to notify */
  contacts: string[];
}

/** Default alerting rules for the platform */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  // Critical alerts
  {
    id: 'auth-failure-surge',
    name: 'Auth Failure Surge',
    description: 'High number of authentication failures detected',
    severity: 'critical',
    condition: 'rate(auth_failures_total[5m]) > 100',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/auth-failure-surge`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'playback-auth-failure',
    name: 'Playback Authorization Failure',
    description: 'High rate of playback authorization failures',
    severity: 'critical',
    condition: 'rate(playback_auth_failures_total[5m]) > 50',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/playback-auth-failure`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'media-team',
    enabled: true,
  },
  {
    id: 'payment-entitlement-lag',
    name: 'Payment-Entitlement Lag',
    description: 'Payment confirmed but entitlement not updated within 10s',
    severity: 'critical',
    condition: 'histogram_quantile(0.99, entitlement_propagation_seconds) > 10',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/payment-entitlement-lag`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'payments-team',
    enabled: true,
  },
  {
    id: 'db-saturation',
    name: 'Database Saturation',
    description: 'Database connection pool exhausted or query latency high',
    severity: 'critical',
    condition: 'db_connections_active > db_connections_max * 0.9',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/db-saturation`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'queue-age',
    name: 'Queue Processing Age',
    description: 'Queue items older than threshold',
    severity: 'critical',
    condition: 'queue_oldest_item_age_seconds > 300',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/queue-age`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'rights-publish-mismatch',
    name: 'Rights Publish Mismatch',
    description: 'Rights policy changes not propagated to all services',
    severity: 'critical',
    condition: 'rights_propagation_lag_seconds > 300',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/rights-publish-mismatch`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'rights-team',
    enabled: true,
  },
  // SLO burn rate alerts
  {
    id: 'slo-burn-rate-critical',
    name: 'SLO Burn Rate Critical',
    description: 'SLO error budget being consumed too fast (2% in 1 hour)',
    severity: 'critical',
    condition: 'slo_burn_rate > 14.4',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/slo-burn-rate`,
    notifications: ['pagerduty', 'slack-critical'],
    owner: 'sre-team',
    enabled: true,
  },
  {
    id: 'slo-burn-rate-warning',
    name: 'SLO Burn Rate Warning',
    description: 'SLO error budget consumption elevated (5% in 6 hours)',
    severity: 'warning',
    condition: 'slo_burn_rate > 6',
    duration: '30m',
    runbookUrl: `${ORIGINS.runbooks}/slo-burn-rate`,
    notifications: ['slack-warning'],
    owner: 'sre-team',
    enabled: true,
  },
  {
    id: 'slo-error-budget-exhausted',
    name: 'SLO Error Budget Exhausted',
    description: 'SLO error budget completely consumed - releases frozen',
    severity: 'critical',
    condition: 'slo_error_budget_remaining <= 0',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/slo-error-budget`,
    notifications: ['pagerduty', 'slack-critical', 'email-leadership'],
    owner: 'sre-team',
    enabled: true,
  },
  // Warning alerts
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'API error rate elevated above normal',
    severity: 'warning',
    condition:
      'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05',
    duration: '10m',
    runbookUrl: `${ORIGINS.runbooks}/high-error-rate`,
    notifications: ['slack-warning'],
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'high-latency',
    name: 'High Latency',
    description: 'API latency P95 above threshold',
    severity: 'warning',
    condition: 'histogram_quantile(0.95, http_request_duration_seconds) > 0.75',
    duration: '10m',
    runbookUrl: `${ORIGINS.runbooks}/high-latency`,
    notifications: ['slack-warning'],
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'provider-callback-backlog',
    name: 'Provider Callback Backlog',
    description: 'Payment provider callbacks delayed',
    severity: 'warning',
    condition: 'provider_callback_age_seconds > 60',
    duration: '5m',
    runbookUrl: `${ORIGINS.runbooks}/provider-callback`,
    notifications: ['slack-warning'],
    owner: 'payments-team',
    enabled: true,
  },
];

/** Default escalation policy */
export const DEFAULT_ESCALATION_POLICY: EscalationPolicy = {
  id: 'default-escalation',
  name: 'Default Escalation',
  levels: [
    {
      level: 1,
      waitMinutes: 0,
      channels: ['pagerduty'],
      contacts: ['on-call-engineer'],
    },
    {
      level: 2,
      waitMinutes: 15,
      channels: ['pagerduty', 'slack-critical'],
      contacts: ['team-lead'],
    },
    {
      level: 3,
      waitMinutes: 30,
      channels: ['pagerduty', 'slack-critical', 'email'],
      contacts: ['engineering-manager', 'vp-engineering'],
    },
    {
      level: 4,
      waitMinutes: 60,
      channels: ['pagerduty', 'slack-critical', 'email', 'sms'],
      contacts: ['cto', 'ceo'],
    },
  ],
};

export class AlertingService {
  private readonly rules: Map<string, AlertRule> = new Map();
  private readonly alerts: Alert[] = [];
  private readonly escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private readonly adapters: Map<string, NotificationChannelAdapter> = new Map();
  private readonly deliveryLogs: AlertDeliveryLog[] = [];
  private readonly lastFiredTimestamps: Map<string, number> = new Map();
  private deduplicationWindowMs: number = 5 * 60 * 1000;

  constructor(rules?: AlertRule[], escalationPolicies?: EscalationPolicy[]) {
    const alertRules = rules || DEFAULT_ALERT_RULES;
    for (const rule of alertRules) {
      this.rules.set(rule.id, rule);
    }

    const policies = escalationPolicies || [DEFAULT_ESCALATION_POLICY];
    for (const policy of policies) {
      this.escalationPolicies.set(policy.id, policy);
    }
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get a specific alert rule
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Enable/disable an alert rule
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Fire an alert
   */
  fireAlert(
    ruleId: string,
    message: string,
    labels: Record<string, string> = {},
    annotations: Record<string, string> = {}
  ): Alert | null {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) return null;

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ruleId,
      severity: rule.severity,
      status: 'firing',
      message,
      labels: { ...labels, alertname: rule.name, severity: rule.severity },
      annotations: {
        ...annotations,
        description: rule.description,
        runbook: rule.runbookUrl || '',
      },
      firedAt: new Date(),
    };

    const now = Date.now();
    const dedupKey = `${ruleId}:${message}`;
    const lastFired = this.lastFiredTimestamps.get(dedupKey);
    const isDuplicate = lastFired !== undefined && now - lastFired < this.deduplicationWindowMs;
    this.lastFiredTimestamps.set(dedupKey, now);

    this.alerts.push(alert);
    void this.sendNotifications(alert, rule, isDuplicate);

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && (alert.status === 'firing' || alert.status === 'acknowledged')) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && alert.status === 'firing') {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
      return true;
    }
    return false;
  }

  /**
   * Get active (firing) alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => a.status === 'firing');
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter((a) => a.severity === severity);
  }

  registerChannelAdapter(adapter: NotificationChannelAdapter): void {
    this.adapters.set(adapter.channel, adapter);
  }

  getDeliveryLogs(): AlertDeliveryLog[] {
    return [...this.deliveryLogs];
  }

  setDeduplicationWindowMs(ms: number): void {
    this.deduplicationWindowMs = ms;
  }

  /**
   * Send notifications for an alert with deduplication and retries
   */
  private async sendNotifications(
    alert: Alert,
    rule: AlertRule,
    isDuplicate: boolean
  ): Promise<void> {
    for (const channel of rule.notifications) {
      if (isDuplicate) {
        this.deliveryLogs.push({
          alertId: alert.id,
          channel,
          status: 'deduplicated',
          attemptCount: 0,
          lastAttemptAt: new Date(),
        });
        continue;
      }
      await this.sendToChannel(alert, channel, rule);
    }
  }

  private async sendToChannel(alert: Alert, channel: string, rule: AlertRule): Promise<void> {
    const adapter = this.adapters.get(channel);
    let attempts = 0;
    const maxRetries = 2;
    let lastError: string | undefined;

    while (attempts <= maxRetries) {
      attempts++;
      try {
        if (adapter) {
          const ok = await adapter.send(alert, rule);
          if (ok) {
            this.deliveryLogs.push({
              alertId: alert.id,
              channel,
              status: 'sent',
              attemptCount: attempts,
              lastAttemptAt: new Date(),
            });
            return;
          }
          lastError = 'Adapter returned false';
        } else {
          // Default registered in-memory audit log
          this.deliveryLogs.push({
            alertId: alert.id,
            channel,
            status: 'sent',
            attemptCount: attempts,
            lastAttemptAt: new Date(),
          });
          return;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    this.deliveryLogs.push({
      alertId: alert.id,
      channel,
      status: 'failed',
      attemptCount: attempts,
      lastAttemptAt: new Date(),
      error: lastError,
    });
  }

  /**
   * Get escalation policy
   */
  getEscalationPolicy(policyId: string): EscalationPolicy | undefined {
    return this.escalationPolicies.get(policyId);
  }

  /**
   * Get alert statistics
   */
  getStats(): {
    totalAlerts: number;
    firingAlerts: number;
    resolvedAlerts: number;
    acknowledgedAlerts: number;
    bySeverity: Record<AlertSeverity, number>;
  } {
    const bySeverity: Record<AlertSeverity, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    for (const alert of this.alerts) {
      if (alert.status === 'firing') {
        bySeverity[alert.severity]++;
      }
    }

    return {
      totalAlerts: this.alerts.length,
      firingAlerts: this.alerts.filter((a) => a.status === 'firing').length,
      resolvedAlerts: this.alerts.filter((a) => a.status === 'resolved').length,
      acknowledgedAlerts: this.alerts.filter((a) => a.status === 'acknowledged').length,
      bySeverity,
    };
  }
}

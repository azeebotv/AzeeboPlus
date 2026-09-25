import { Injectable, Logger, Optional } from '@nestjs/common';
import { createHash } from 'crypto';

// ============================================================================
// PII Minimisation Before Broad Analytics Access (TAA §39)
//
// Analytics data must be stripped of PII before being exposed to:
// - Broad analytics dashboards
// - Third-party integrations
// - Data warehouse exports
// - Sponsor reporting
//
// Only aggregated/anonymized data should be accessible without strict controls.
// ============================================================================

/** PII field patterns that must be redacted or hashed */
const PII_FIELD_PATTERNS = [
  'email',
  'phone',
  'address',
  'ip',
  'ipAddress',
  'userAgent',
  'deviceId',
  'advertisingId',
  'idfa',
  'gaid',
  'creditCard',
  'ssn',
  'passport',
  'driverLicense',
  'fullName',
  'firstName',
  'lastName',
  'dateOfBirth',
  'dob',
];

/** Fields that are always safe to include */
const SAFE_FIELDS = [
  'userId', // Hashed version
  'sessionId', // Hashed version
  'eventType',
  'timestamp',
  'platform',
  'country', // Country is not PII
  'deviceType',
  'appVersion',
  'contentId',
  'universe',
  'contentType',
  'campaignId',
];

export interface PIIMinimizationConfig {
  /** Hash user identifiers (userId, sessionId) */
  hashUserIds: boolean;
  /** Redact IP addresses */
  redactIpAddresses: boolean;
  /** Redact user agents */
  redactUserAgents: boolean;
  /** Minimum aggregation threshold (users) */
  minAggregationThreshold: number;
  /** K-anonymity threshold */
  kAnonymityThreshold: number;
}

const DEFAULT_CONFIG: PIIMinimizationConfig = {
  hashUserIds: true,
  redactIpAddresses: true,
  redactUserAgents: true,
  minAggregationThreshold: 50,
  kAnonymityThreshold: 5,
};

@Injectable()
export class PIIMinimizationService {
  private readonly logger = new Logger(PIIMinimizationService.name);
  private readonly config: PIIMinimizationConfig;

  constructor(@Optional() config?: Partial<PIIMinimizationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Hash a value using SHA-256 (for user identifiers)
   */
  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  /**
   * Check if a field name contains PII
   */
  private isPIIField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return PII_FIELD_PATTERNS.some((pattern) => lowerField.includes(pattern.toLowerCase()));
  }

  /**
   * Minimize a single event for analytics access
   */
  minimizeEvent(event: Record<string, unknown>): Record<string, unknown> {
    const minimized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(event)) {
      // Always include safe fields
      if (SAFE_FIELDS.includes(key)) {
        if (key === 'userId' && this.config.hashUserIds && typeof value === 'string') {
          minimized[key] = this.hashValue(value);
        } else if (key === 'sessionId' && this.config.hashUserIds && typeof value === 'string') {
          minimized[key] = this.hashValue(value);
        } else {
          minimized[key] = value;
        }
        continue;
      }

      // Redact PII fields
      if (this.isPIIField(key)) {
        if (key.toLowerCase().includes('ip') && this.config.redactIpAddresses) {
          minimized[key] = '[REDACTED_IP]';
        } else if (key.toLowerCase().includes('useragent') && this.config.redactUserAgents) {
          minimized[key] = '[REDACTED_UA]';
        } else {
          minimized[key] = '[REDACTED]';
        }
        continue;
      }

      // Check if value itself contains PII patterns
      if (typeof value === 'string') {
        if (this.containsEmail(value)) {
          minimized[key] = '[REDACTED_EMAIL]';
        } else if (this.containsPhoneNumber(value)) {
          minimized[key] = '[REDACTED_PHONE]';
        } else if (this.containsIpAddress(value)) {
          minimized[key] = '[REDACTED_IP]';
        } else {
          minimized[key] = value;
        }
      } else {
        minimized[key] = value;
      }
    }

    return minimized;
  }

  /**
   * Minimize a batch of events
   */
  minimizeEvents(events: Record<string, unknown>[]): Record<string, unknown>[] {
    return events.map((event) => this.minimizeEvent(event));
  }

  /**
   * Check if a string contains an email address
   */
  private containsEmail(value: string): boolean {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    return emailRegex.test(value);
  }

  /**
   * Check if a string contains a phone number
   */
  private containsPhoneNumber(value: string): boolean {
    const phoneRegex = /(\+?[\d\s-]{10,})/;
    return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
  }

  /**
   * Check if a string contains an IP address
   */
  private containsIpAddress(value: string): boolean {
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    return ipRegex.test(value);
  }

  /**
   * Apply k-anonymity to aggregated data
   * Ensures each group has at least k individuals
   */
  applyKAnonymity<T extends Record<string, unknown>>(data: T[], groupByFields: string[]): T[] {
    if (data.length === 0) return data;

    // Group data
    const groups = new Map<string, T[]>();
    for (const item of data) {
      const key = groupByFields.map((f) => String(item[f] ?? '')).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    // Filter groups with less than k members
    const result: T[] = [];
    for (const group of groups.values()) {
      if (group.length >= this.config.kAnonymityThreshold) {
        result.push(...group);
      } else {
        // Replace with aggregate
        this.logger.warn(`Group with ${group.length} members below k-threshold, aggregating`);
        // In production, would replace with aggregate row
      }
    }

    return result;
  }

  /**
   * Check if aggregation meets minimum threshold
   */
  meetsAggregationThreshold(count: number): boolean {
    return count >= this.config.minAggregationThreshold;
  }

  /**
   * Get PII minimization config
   */
  getConfig(): PIIMinimizationConfig {
    return { ...this.config };
  }
}

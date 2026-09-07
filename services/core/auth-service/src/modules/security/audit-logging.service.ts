import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_CHALLENGE_SUCCESS = 'MFA_CHALLENGE_SUCCESS',
  MFA_CHALLENGE_FAILED = 'MFA_CHALLENGE_FAILED',

  // Authorization events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Data events
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_EXPORTED = 'DATA_EXPORTED',

  // Payment events
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  WITHDRAWAL_REQUESTED = 'WITHDRAWAL_REQUESTED',
  WITHDRAWAL_COMPLETED = 'WITHDRAWAL_COMPLETED',

  // Security events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  IP_BLOCKED = 'IP_BLOCKED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // System events
  SERVICE_STARTED = 'SERVICE_STARTED',
  SERVICE_STOPPED = 'SERVICE_STOPPED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  details?: Record<string, unknown>;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  success: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);

  constructor(@Optional() _configService?: ConfigService) {}

  /**
   * Log an audit event
   */
  async logEvent(params: {
    eventType: AuditEventType;
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    details?: Record<string, unknown>;
    severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      eventType: params.eventType,
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resource: params.resource,
      resourceId: params.resourceId,
      action: params.action,
      details: params.details,
      severity: params.severity || 'INFO',
      success: params.success !== undefined ? params.success : true,
      errorMessage: params.errorMessage,
    };

    // Log to console
    this.logToConsole(entry);

    // In production, this would:
    // 1. Store in database
    // 2. Send to CloudWatch/ELK
    // 3. Trigger alerts for critical events

    // Check for suspicious activity
    await this.checkSuspiciousActivity(entry);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    eventType: AuditEventType,
    params: {
      userId?: string;
      ipAddress: string;
      userAgent: string;
      success: boolean;
      details?: Record<string, unknown>;
      errorMessage?: string;
    }
  ): Promise<void> {
    const severity = params.success ? 'INFO' : 'WARNING';
    if (eventType === AuditEventType.LOGIN_FAILED) {
      // Check for brute force attempts
      await this.checkBruteForce(params.ipAddress, params.userId);
    }

    await this.logEvent({
      eventType,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resource: 'auth',
      details: params.details,
      severity,
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }

  /**
   * Log payment events
   */
  async logPaymentEvent(
    eventType: AuditEventType,
    params: {
      userId: string;
      ipAddress: string;
      userAgent: string;
      amount: number;
      currency: string;
      provider: string;
      transactionId?: string;
      success: boolean;
      details?: Record<string, unknown>;
      errorMessage?: string;
    }
  ): Promise<void> {
    const severity = params.success ? 'INFO' : 'ERROR';

    await this.logEvent({
      eventType,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resource: 'payment',
      resourceId: params.transactionId,
      action: eventType,
      details: {
        ...params.details,
        amount: params.amount,
        currency: params.currency,
        provider: params.provider,
        transactionId: params.transactionId,
      },
      severity,
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    params: {
      ipAddress: string;
      userAgent: string;
      userId?: string;
      details?: Record<string, unknown>;
      severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    }
  ): Promise<void> {
    await this.logEvent({
      eventType,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resource: 'security',
      details: params.details,
      severity: params.severity || 'WARNING',
      success: false,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    _options?: {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: AuditEventType[];
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    // In production, this would query the database
    this.logger.log(`Fetching audit logs for user ${userId}`);
    return [];
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    _options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    // In production, this would query the database
    this.logger.log(`Fetching audit logs for ${resource}/${resourceId}`);
    return [];
  }

  /**
   * Check for suspicious activity
   */
  private async checkSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
    // Check for multiple failed login attempts
    if (entry.eventType === AuditEventType.LOGIN_FAILED) {
      // In production, check Redis for recent failed attempts
      this.logger.warn(
        `Failed login attempt from ${entry.ipAddress} for user ${entry.userId || 'unknown'}`
      );
    }

    // Check for unauthorized access attempts
    if (entry.eventType === AuditEventType.UNAUTHORIZED_ACCESS) {
      this.logger.warn(
        `Unauthorized access attempt from ${entry.ipAddress}: ${entry.resource}/${entry.resourceId}`
      );
    }

    // Check for rate limit exceeded
    if (entry.eventType === AuditEventType.RATE_LIMIT_EXCEEDED) {
      this.logger.warn(`Rate limit exceeded from ${entry.ipAddress}`);
    }
  }

  /**
   * Check for brute force attacks
   */
  private async checkBruteForce(ipAddress: string, userId?: string): Promise<void> {
    // In production, this would check Redis for recent failed attempts
    // If threshold exceeded, trigger alert
    this.logger.warn(`Checking brute force for IP ${ipAddress}, user ${userId || 'unknown'}`);
  }

  /**
   * Log to console (structured logging)
   */
  private logToConsole(entry: AuditLogEntry): void {
    const logMessage = {
      auditId: entry.id,
      timestamp: entry.timestamp.toISOString(),
      eventType: entry.eventType,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      resource: entry.resource,
      resourceId: entry.resourceId,
      severity: entry.severity,
      success: entry.success,
    };

    switch (entry.severity) {
      case 'CRITICAL':
        this.logger.error(`AUDIT: ${JSON.stringify(logMessage)}`);
        break;
      case 'ERROR':
        this.logger.error(`AUDIT: ${JSON.stringify(logMessage)}`);
        break;
      case 'WARNING':
        this.logger.warn(`AUDIT: ${JSON.stringify(logMessage)}`);
        break;
      default:
        this.logger.log(`AUDIT: ${JSON.stringify(logMessage)}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

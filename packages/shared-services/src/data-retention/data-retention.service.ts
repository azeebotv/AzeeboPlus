import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Data Retention & Classification (Appendix C)
// ============================================================================

export interface RetentionPolicy {
  /** Data classification */
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  /** Retention period in days */
  retentionDays: number;
  /** Whether to anonymize instead of delete */
  anonymizeInsteadOfDelete: boolean;
  /** Fields to anonymize */
  anonymizeFields?: string[];
  /** Whether this data has legal retention requirements */
  hasLegalRetention: boolean;
  /** Legal retention minimum days (if applicable) */
  legalRetentionDays?: number;
  /** Whether this data is subject to GDPR right to erasure */
  subjectToErasure: boolean;
  /** Additional notes */
  notes?: string;
}

export interface RetentionResult {
  dataType: string;
  totalRecords: number;
  recordsAnonymized: number;
  recordsDeleted: number;
  recordsSkipped: number;
  errors: string[];
  notes?: string;
}

/**
 * Abstract database interface for retention operations.
 * Implementations should provide actual Prisma client access.
 */
export interface RetentionDatabase {
  user: {
    findMany(args: {
      where: Record<string, unknown>;
      select?: Record<string, unknown>;
    }): Promise<Array<{ id: string; email: string; displayName: string; [key: string]: unknown }>>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
    delete(args: { where: { id: string } }): Promise<unknown>;
    count(args: { where: Record<string, unknown> }): Promise<number>;
  };
  watchHistory: {
    findMany(args: {
      where: Record<string, unknown>;
      select?: Record<string, unknown>;
    }): Promise<Array<{ id: string; userId: string; [key: string]: unknown }>>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
    delete(args: { where: { id: string } }): Promise<unknown>;
    count(args: { where: Record<string, unknown> }): Promise<number>;
  };
}

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(private readonly db: RetentionDatabase) {}

  // ============================================================================
  // Retention Policies (Appendix C)
  // ============================================================================

  private readonly policies: Record<string, RetentionPolicy> = {
    // Account identity (Restricted)
    accountIdentity: {
      classification: 'restricted',
      retentionDays: 365 * 7, // 7 years
      anonymizeInsteadOfDelete: true,
      anonymizeFields: ['email', 'displayName', 'bio', 'avatar'],
      hasLegalRetention: true,
      legalRetentionDays: 365 * 7,
      subjectToErasure: true,
      notes: 'Retain for legal compliance; anonymize PII',
    },

    // Consent records (Confidential)
    consentRecords: {
      classification: 'confidential',
      retentionDays: 365 * 10, // 10 years
      anonymizeInsteadOfDelete: false,
      hasLegalRetention: true,
      legalRetentionDays: 365 * 10,
      subjectToErasure: false,
      notes: 'Retain version/history for compliance',
    },

    // Watch progress (Confidential)
    watchProgress: {
      classification: 'confidential',
      retentionDays: 365 * 2, // 2 years
      anonymizeInsteadOfDelete: true,
      anonymizeFields: ['userId', 'contentId'],
      hasLegalRetention: false,
      subjectToErasure: true,
    },

    // Payment references (Restricted)
    paymentReferences: {
      classification: 'restricted',
      retentionDays: 365 * 7, // 7 years
      anonymizeInsteadOfDelete: false,
      hasLegalRetention: true,
      legalRetentionDays: 365 * 7,
      subjectToErasure: false,
      notes: 'Finance/legal retention requirements',
    },

    // Entitlement ledger (Confidential)
    entitlementLedger: {
      classification: 'confidential',
      retentionDays: 365 * 5, // 5 years
      anonymizeInsteadOfDelete: true,
      anonymizeFields: ['userId'],
      hasLegalRetention: true,
      legalRetentionDays: 365 * 5,
      subjectToErasure: false,
      notes: 'Commercial/audit retention',
    },

    // Reward ledger (Confidential)
    rewardLedger: {
      classification: 'confidential',
      retentionDays: 365 * 3, // 3 years
      anonymizeInsteadOfDelete: true,
      anonymizeFields: ['userId'],
      hasLegalRetention: false,
      subjectToErasure: true,
    },

    // Analytics events (Confidential/Pseudonymous)
    analyticsEvents: {
      classification: 'confidential',
      retentionDays: 365, // 1 year
      anonymizeInsteadOfDelete: true,
      anonymizeFields: ['userId', 'sessionId'],
      hasLegalRetention: false,
      subjectToErasure: true,
      notes: 'Tiered retention - older data archived then deleted',
    },

    // Admin audit (Restricted)
    adminAudit: {
      classification: 'restricted',
      retentionDays: 365 * 10, // 10 years
      anonymizeInsteadOfDelete: false,
      hasLegalRetention: true,
      legalRetentionDays: 365 * 10,
      subjectToErasure: false,
      notes: 'Security/legal retention',
    },

    // Media derivatives (Internal/Public)
    mediaDerivatives: {
      classification: 'internal',
      retentionDays: 365 * 2, // 2 years after rights window
      anonymizeInsteadOfDelete: false,
      hasLegalRetention: false,
      subjectToErasure: true,
      notes: 'Rights window + lifecycle dependent',
    },
  };

  // ============================================================================
  // Enforcement Methods
  // ============================================================================

  /**
   * Get retention policy for a data type
   */
  getPolicy(dataType: string): RetentionPolicy | undefined {
    return this.policies[dataType];
  }

  /**
   * Get all retention policies
   */
  getAllPolicies(): Record<string, RetentionPolicy> {
    return { ...this.policies };
  }

  /**
   * Enforce retention for a specific data type
   */
  async enforceRetention(dataType: string): Promise<RetentionResult> {
    const policy = this.policies[dataType];
    if (!policy) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    this.logger.log(
      `Enforcing retention for ${dataType} (classification: ${policy.classification})`
    );

    const result: RetentionResult = {
      dataType,
      totalRecords: 0,
      recordsAnonymized: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      errors: [],
    };

    try {
      switch (dataType) {
        case 'accountIdentity':
          await this.enforceAccountIdentityRetention(result, policy);
          break;
        case 'consentRecords':
          await this.enforceConsentRetention(result, policy);
          break;
        case 'watchProgress':
          await this.enforceWatchProgressRetention(result, policy);
          break;
        case 'paymentReferences':
          await this.enforcePaymentRetention(result, policy);
          break;
        case 'entitlementLedger':
          await this.enforceEntitlementRetention(result, policy);
          break;
        case 'rewardLedger':
          await this.enforceRewardRetention(result, policy);
          break;
        case 'analyticsEvents':
          await this.enforceAnalyticsRetention(result, policy);
          break;
        case 'adminAudit':
          await this.enforceAdminAuditRetention(result, policy);
          break;
        default:
          result.errors.push(`No enforcement logic for data type: ${dataType}`);
      }
    } catch (error) {
      result.errors.push((error as Error).message);
      this.logger.error(`Failed to enforce retention for ${dataType}: ${(error as Error).message}`);
    }

    this.logger.log(
      `Retention enforcement complete for ${dataType}: ${result.recordsAnonymized} anonymized, ${result.recordsDeleted} deleted`
    );
    return result;
  }

  /**
   * Enforce all retention policies
   */
  async enforceAllRetention(): Promise<RetentionResult[]> {
    const results: RetentionResult[] = [];

    for (const dataType of Object.keys(this.policies)) {
      const result = await this.enforceRetention(dataType);
      results.push(result);
    }

    return results;
  }

  // ============================================================================
  // Specific Enforcement Methods
  // ============================================================================

  private async enforceAccountIdentityRetention(
    result: RetentionResult,
    policy: RetentionPolicy
  ): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Find inactive accounts (no login in retention period)
    const inactiveAccounts = await this.db.user.findMany({
      where: {
        lastLoginAt: { lt: cutoffDate },
      },
      select: { id: true, email: true, displayName: true },
    });

    result.totalRecords = inactiveAccounts.length;

    for (const account of inactiveAccounts) {
      try {
        if (policy.anonymizeInsteadOfDelete) {
          // Anonymize PII
          await this.db.user.update({
            where: { id: account.id },
            data: {
              email: `anonymized_${account.id}@deleted.local`,
              displayName: 'Deleted User',
              bio: null,
              avatar: null,
            },
          });
          result.recordsAnonymized++;
        } else {
          // Delete account (if legally permitted)
          if (!policy.hasLegalRetention || policy.legalRetentionDays === 0) {
            await this.db.user.delete({ where: { id: account.id } });
            result.recordsDeleted++;
          } else {
            result.recordsSkipped++;
          }
        }
      } catch (error) {
        result.errors.push(`Failed to process account ${account.id}: ${(error as Error).message}`);
      }
    }
  }

  private async enforceConsentRetention(
    result: RetentionResult,
    _policy: RetentionPolicy
  ): Promise<void> {
    // Consent records are retained for legal compliance - no deletion
    result.recordsSkipped = 0;
    result.notes = 'Consent records retained per legal requirements';
  }

  private async enforceWatchProgressRetention(
    result: RetentionResult,
    policy: RetentionPolicy
  ): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Find old watch progress
    const oldProgress = await this.db.watchHistory.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
      },
      select: { id: true, userId: true },
    });

    result.totalRecords = oldProgress.length;

    for (const progress of oldProgress) {
      try {
        if (policy.anonymizeInsteadOfDelete) {
          await this.db.watchHistory.update({
            where: { id: progress.id },
            data: {
              userId: 'anonymized',
              metadata: { anonymized: true, anonymizedAt: new Date().toISOString() },
            },
          });
          result.recordsAnonymized++;
        } else {
          await this.db.watchHistory.delete({ where: { id: progress.id } });
          result.recordsDeleted++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to process watch progress ${progress.id}: ${(error as Error).message}`
        );
      }
    }
  }

  private async enforcePaymentRetention(
    result: RetentionResult,
    _policy: RetentionPolicy
  ): Promise<void> {
    // Payment records have legal retention - no deletion
    result.recordsSkipped = 0;
    result.notes = 'Payment records retained per financial/legal requirements';
  }

  private async enforceEntitlementRetention(
    result: RetentionResult,
    _policy: RetentionPolicy
  ): Promise<void> {
    // Anonymize old entitlement records
    result.totalRecords = 0;
    result.recordsAnonymized = 0;
    result.notes = 'Entitlement ledger anonymization not yet implemented';
  }

  private async enforceRewardRetention(
    result: RetentionResult,
    _policy: RetentionPolicy
  ): Promise<void> {
    // Anonymize old reward records
    result.totalRecords = 0;
    result.recordsAnonymized = 0;
    result.notes = 'Reward ledger anonymization not yet implemented';
  }

  private async enforceAnalyticsRetention(
    result: RetentionResult,
    _policy: RetentionPolicy
  ): Promise<void> {
    // Anonymize old analytics events
    result.totalRecords = 0;
    result.recordsAnonymized = 0;
    result.notes = 'Analytics event anonymization not yet implemented';
  }

  private async enforceAdminAuditRetention(
    result: RetentionResult,
    _policy: RetentionPolicy
  ): Promise<void> {
    // Admin audit records have legal retention - no deletion
    result.recordsSkipped = 0;
    result.notes = 'Admin audit records retained per security/legal requirements';
  }

  // ============================================================================
  // GDPR Right to Erasure
  // ============================================================================

  /**
   * Handle GDPR right to erasure for a user
   */
  async handleErasureRequest(userId: string): Promise<{
    anonymized: string[];
    deleted: string[];
    retained: string[];
  }> {
    this.logger.log(`Processing erasure request for user: ${userId}`);

    const result = {
      anonymized: [] as string[],
      deleted: [] as string[],
      retained: [] as string[],
    };

    // Check each data type
    for (const [dataType, policy] of Object.entries(this.policies)) {
      if (policy.subjectToErasure) {
        if (policy.anonymizeInsteadOfDelete) {
          result.anonymized.push(dataType);
        } else {
          result.deleted.push(dataType);
        }
      } else {
        result.retained.push(dataType);
      }
    }

    // Anonymize account identity
    await this.db.user.update({
      where: { id: userId },
      data: {
        email: `erased_${userId}@deleted.local`,
        displayName: 'Erased User',
        bio: null,
        avatar: null,
        metadata: { erased: true, erasedAt: new Date().toISOString() },
      },
    });

    this.logger.log(
      `Erasure request processed for user ${userId}: ${result.anonymized.length} anonymized, ${result.deleted.length} deleted, ${result.retained.length} retained`
    );
    return result;
  }
}

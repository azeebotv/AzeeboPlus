import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Data Classification (TAA §51)
// ============================================================================

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface ClassificationLabel {
  classification: DataClassification;
  /** Who can access this data */
  accessScope: string[];
  /** Whether encryption at rest is required */
  encryptionRequired: boolean;
  /** Whether audit logging is required */
  auditRequired: boolean;
  /** Retention period in days */
  retentionDays?: number;
  /** Whether data can be cached/CDN'd */
  cacheable: boolean;
}

/**
 * Registry of data classifications for all domain models.
 * Each Prisma model should be mapped to a classification.
 */
export const CLASSIFICATION_REGISTRY: Record<string, ClassificationLabel> = {
  // Identity domain — Restricted (PII)
  User: {
    classification: 'restricted',
    accessScope: ['identity-service', 'admin'],
    encryptionRequired: true,
    auditRequired: true,
    retentionDays: 365 * 7,
    cacheable: false,
  },
  UserSession: {
    classification: 'restricted',
    accessScope: ['auth-service', 'admin'],
    encryptionRequired: true,
    auditRequired: true,
    retentionDays: 90,
    cacheable: false,
  },

  // Content domain — Confidential
  ContentItem: {
    classification: 'confidential',
    accessScope: ['content-service', 'search-service', 'admin'],
    encryptionRequired: false,
    auditRequired: false,
    cacheable: true,
  },

  // Commerce domain — Restricted
  Payment: {
    classification: 'restricted',
    accessScope: ['payment-service', 'admin'],
    encryptionRequired: true,
    auditRequired: true,
    retentionDays: 365 * 7,
    cacheable: false,
  },
  Wallet: {
    classification: 'restricted',
    accessScope: ['wallet-service', 'admin'],
    encryptionRequired: true,
    auditRequired: true,
    cacheable: false,
  },

  // Rewards domain — Confidential
  PointsLedger: {
    classification: 'confidential',
    accessScope: ['reward-service', 'admin'],
    encryptionRequired: false,
    auditRequired: true,
    retentionDays: 365 * 3,
    cacheable: false,
  },

  // Knowledge domain — Confidential
  KnowledgeGrant: {
    classification: 'confidential',
    accessScope: ['knowledge-service', 'admin'],
    encryptionRequired: false,
    auditRequired: false,
    cacheable: true,
  },

  // Audit domain — Restricted (immutable)
  AuditLog: {
    classification: 'restricted',
    accessScope: ['admin', 'security-team'],
    encryptionRequired: true,
    auditRequired: true,
    retentionDays: 365 * 10,
    cacheable: false,
  },

  // Search — Internal
  SearchQueryLog: {
    classification: 'internal',
    accessScope: ['search-service', 'analytics-service'],
    encryptionRequired: false,
    auditRequired: false,
    retentionDays: 30, // Anonymized after 30 days
    cacheable: false,
  },
};

@Injectable()
export class DataClassificationService {
  private readonly logger = new Logger(DataClassificationService.name);

  /**
   * Get classification label for a model
   */
  getClassification(modelName: string): ClassificationLabel | undefined {
    return CLASSIFICATION_REGISTRY[modelName];
  }

  /**
   * Check if a user/service has access to a model's data
   */
  hasAccess(modelName: string, requestor: string): boolean {
    const label = CLASSIFICATION_REGISTRY[modelName];
    if (!label) {
      this.logger.warn(`No classification found for model: ${modelName}`);
      return false;
    }
    return label.accessScope.includes(requestor);
  }

  /**
   * Check if encryption at rest is required for a model
   */
  requiresEncryption(modelName: string): boolean {
    const label = CLASSIFICATION_REGISTRY[modelName];
    return label?.encryptionRequired ?? false;
  }

  /**
   * Check if audit logging is required for a model
   */
  requiresAudit(modelName: string): boolean {
    const label = CLASSIFICATION_REGISTRY[modelName];
    return label?.auditRequired ?? false;
  }

  /**
   * Get all models with a specific classification
   */
  getModelsByClassification(classification: DataClassification): string[] {
    return Object.entries(CLASSIFICATION_REGISTRY)
      .filter(([, label]) => label.classification === classification)
      .map(([model]) => model);
  }

  /**
   * Get all restricted models (highest security)
   */
  getRestrictedModels(): string[] {
    return this.getModelsByClassification('restricted');
  }
}

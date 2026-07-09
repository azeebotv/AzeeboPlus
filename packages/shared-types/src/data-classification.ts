export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  PII = 'PII',
  SENSITIVE_PII = 'SENSITIVE_PII',
}

export interface DataClassificationMetadata {
  field: string;
  classification: DataClassification;
  retentionPeriod?: string; // ISO 8601 duration format (e.g., "P730D" = 2 years)
  requiresConsent?: boolean;
  piiCategory?: PiiCategory;
}

export enum PiiCategory {
  IDENTIFICATION = 'IDENTIFICATION', // Name, email, phone, ID numbers
  LOCATION = 'LOCATION', // GPS, IP addresses
  BEHAVIORAL = 'BEHAVIORAL', // Usage data, preferences
  FINANCIAL = 'FINANCIAL', // Payment info, transactions
  AUTHENTICATION = 'AUTHENTICATION', // Passwords, tokens, biometric data
  COMMUNICATIONS = 'COMMUNICATIONS', // Messages, content
}

export interface UserDataExport {
  userId: string;
  exportDate: Date;
  data: Record<string, unknown>;
  format: 'json';
}

export interface UserDataDeletionRequest {
  userId: string;
  reason?: string;
  scheduledFor: Date;
  deletedAt?: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface RetentionPolicy {
  classification: DataClassification;
  retentionPeriod: string; // ISO 8601 duration
  autoDelete: boolean;
  reviewRequired: boolean;
}

// Default retention policies
export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    classification: DataClassification.PII,
    retentionPeriod: 'P1095D',
    autoDelete: true,
    reviewRequired: true,
  }, // 3 years
  {
    classification: DataClassification.SENSITIVE_PII,
    retentionPeriod: 'P730D',
    autoDelete: true,
    reviewRequired: false,
  }, // 2 years
  {
    classification: DataClassification.CONFIDENTIAL,
    retentionPeriod: 'P1825D',
    autoDelete: false,
    reviewRequired: true,
  }, // 5 years
  {
    classification: DataClassification.INTERNAL,
    retentionPeriod: 'P365D',
    autoDelete: false,
    reviewRequired: false,
  }, // 1 year
  {
    classification: DataClassification.PUBLIC,
    retentionPeriod: 'PINF',
    autoDelete: false,
    reviewRequired: false,
  }, // Infinite
];

export enum ConsentType {
  ESSENTIAL = 'ESSENTIAL',
  ANALYTICS = 'ANALYTICS',
  MARKETING = 'MARKETING',
  PERSONALIZATION = 'PERSONALIZATION',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  piiAccessed?: string[];
}

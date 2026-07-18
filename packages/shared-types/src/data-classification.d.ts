export declare enum DataClassification {
    PUBLIC = "PUBLIC",
    INTERNAL = "INTERNAL",
    CONFIDENTIAL = "CONFIDENTIAL",
    PII = "PII",
    SENSITIVE_PII = "SENSITIVE_PII"
}
export interface DataClassificationMetadata {
    field: string;
    classification: DataClassification;
    retentionPeriod?: string;
    requiresConsent?: boolean;
    piiCategory?: PiiCategory;
}
export declare enum PiiCategory {
    IDENTIFICATION = "IDENTIFICATION",
    LOCATION = "LOCATION",
    BEHAVIORAL = "BEHAVIORAL",
    FINANCIAL = "FINANCIAL",
    AUTHENTICATION = "AUTHENTICATION",
    COMMUNICATIONS = "COMMUNICATIONS"
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
    retentionPeriod: string;
    autoDelete: boolean;
    reviewRequired: boolean;
}
export declare const DEFAULT_RETENTION_POLICIES: RetentionPolicy[];
export declare enum ConsentType {
    ESSENTIAL = "ESSENTIAL",
    ANALYTICS = "ANALYTICS",
    MARKETING = "MARKETING",
    PERSONALIZATION = "PERSONALIZATION",
    THIRD_PARTY_SHARING = "THIRD_PARTY_SHARING"
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

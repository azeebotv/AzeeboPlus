import { ConsentType } from './data-classification';
export interface PrivacyPolicy {
    version: string;
    effectiveDate: Date;
    content: PrivacyPolicySection[];
    requiredConsents: ConsentType[];
}
export interface PrivacyPolicySection {
    id: string;
    title: string;
    content: string;
    consentType?: ConsentType;
    required: boolean;
}
export interface PrivacyPolicyAcceptance {
    id: string;
    userId: string;
    policyVersion: string;
    acceptedAt: Date;
    consentTypes: ConsentType[];
    ipAddress?: string;
    userAgent?: string;
}
export interface ConsentAuditLog {
    id: string;
    userId: string;
    consentType: ConsentType;
    action: 'GRANTED' | 'REVOKED';
    timestamp: Date;
    policyVersion: string;
}
export declare const PRIVACY_POLICY: PrivacyPolicy;
export declare function checkConsentCompliance(userAcceptances: PrivacyPolicyAcceptance[], requiredConsents: ConsentType[]): boolean;

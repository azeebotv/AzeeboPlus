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
/**
 * Checks whether a user has granted all required consent types.
 *
 * Looks up the most recent PrivacyPolicyAcceptance for the user and verifies
 * that every consent type in `requiredConsents` is present in the acceptance
 * record's consentTypes.  The caller is expected to provide the acceptance
 * records (e.g. from a database query).
 *
 * @param userAcceptances - All acceptance records for the user, newest first.
 * @param requiredConsents - The consent types that must be granted.
 * @returns `true` if every required consent has been granted at least once.
 */
export declare function checkConsentCompliance(userAcceptances: PrivacyPolicyAcceptance[], requiredConsents: ConsentType[]): boolean;

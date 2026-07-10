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

// Current privacy policy configuration
export const PRIVACY_POLICY: PrivacyPolicy = {
  version: '1.0.0',
  effectiveDate: new Date('2024-01-01'),
  content: [
    {
      id: 'essential',
      title: 'Essential Services',
      content:
        'Data necessary for account creation, authentication, and core platform functionality.',
      consentType: ConsentType.ESSENTIAL,
      required: true,
    },
    {
      id: 'analytics',
      title: 'Usage Analytics',
      content: 'Data used to improve our services and user experience.',
      consentType: ConsentType.ANALYTICS,
      required: false,
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      content: 'Data used for promotional emails and notifications.',
      consentType: ConsentType.MARKETING,
      required: false,
    },
  ],
  requiredConsents: [ConsentType.ESSENTIAL],
};

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
export function checkConsentCompliance(
  userAcceptances: PrivacyPolicyAcceptance[],
  requiredConsents: ConsentType[]
): boolean {
  if (requiredConsents.length === 0) return true;
  if (!userAcceptances || userAcceptances.length === 0) return false;

  const grantedTypes = new Set<ConsentType>(userAcceptances.flatMap((a) => a.consentTypes));

  return requiredConsents.every((c) => grantedTypes.has(c));
}

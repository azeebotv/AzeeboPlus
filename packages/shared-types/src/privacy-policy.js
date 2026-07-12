"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIVACY_POLICY = void 0;
exports.checkConsentCompliance = checkConsentCompliance;
const data_classification_1 = require("./data-classification");
// Current privacy policy configuration
exports.PRIVACY_POLICY = {
    version: '1.0.0',
    effectiveDate: new Date('2024-01-01'),
    content: [
        {
            id: 'essential',
            title: 'Essential Services',
            content: 'Data necessary for account creation, authentication, and core platform functionality.',
            consentType: data_classification_1.ConsentType.ESSENTIAL,
            required: true,
        },
        {
            id: 'analytics',
            title: 'Usage Analytics',
            content: 'Data used to improve our services and user experience.',
            consentType: data_classification_1.ConsentType.ANALYTICS,
            required: false,
        },
        {
            id: 'marketing',
            title: 'Marketing Communications',
            content: 'Data used for promotional emails and notifications.',
            consentType: data_classification_1.ConsentType.MARKETING,
            required: false,
        },
    ],
    requiredConsents: [data_classification_1.ConsentType.ESSENTIAL],
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
function checkConsentCompliance(userAcceptances, requiredConsents) {
    if (requiredConsents.length === 0)
        return true;
    if (!userAcceptances || userAcceptances.length === 0)
        return false;
    const grantedTypes = new Set(userAcceptances.flatMap((a) => a.consentTypes));
    return requiredConsents.every((c) => grantedTypes.has(c));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIVACY_POLICY = void 0;
exports.checkConsentCompliance = checkConsentCompliance;
const data_classification_1 = require("./data-classification");
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
function checkConsentCompliance(userAcceptances, requiredConsents) {
    if (requiredConsents.length === 0)
        return true;
    if (!userAcceptances || userAcceptances.length === 0)
        return false;
    const grantedTypes = new Set(userAcceptances.flatMap((a) => a.consentTypes));
    return requiredConsents.every((c) => grantedTypes.has(c));
}
//# sourceMappingURL=privacy-policy.js.map
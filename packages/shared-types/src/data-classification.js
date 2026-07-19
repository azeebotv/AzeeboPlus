"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentType = exports.DEFAULT_RETENTION_POLICIES = exports.PiiCategory = exports.DataClassification = void 0;
var DataClassification;
(function (DataClassification) {
    DataClassification["PUBLIC"] = "PUBLIC";
    DataClassification["INTERNAL"] = "INTERNAL";
    DataClassification["CONFIDENTIAL"] = "CONFIDENTIAL";
    DataClassification["PII"] = "PII";
    DataClassification["SENSITIVE_PII"] = "SENSITIVE_PII";
})(DataClassification || (exports.DataClassification = DataClassification = {}));
var PiiCategory;
(function (PiiCategory) {
    PiiCategory["IDENTIFICATION"] = "IDENTIFICATION";
    PiiCategory["LOCATION"] = "LOCATION";
    PiiCategory["BEHAVIORAL"] = "BEHAVIORAL";
    PiiCategory["FINANCIAL"] = "FINANCIAL";
    PiiCategory["AUTHENTICATION"] = "AUTHENTICATION";
    PiiCategory["COMMUNICATIONS"] = "COMMUNICATIONS";
})(PiiCategory || (exports.PiiCategory = PiiCategory = {}));
exports.DEFAULT_RETENTION_POLICIES = [
    {
        classification: DataClassification.PII,
        retentionPeriod: 'P1095D',
        autoDelete: true,
        reviewRequired: true,
    },
    {
        classification: DataClassification.SENSITIVE_PII,
        retentionPeriod: 'P730D',
        autoDelete: true,
        reviewRequired: false,
    },
    {
        classification: DataClassification.CONFIDENTIAL,
        retentionPeriod: 'P1825D',
        autoDelete: false,
        reviewRequired: true,
    },
    {
        classification: DataClassification.INTERNAL,
        retentionPeriod: 'P365D',
        autoDelete: false,
        reviewRequired: false,
    },
    {
        classification: DataClassification.PUBLIC,
        retentionPeriod: 'PINF',
        autoDelete: false,
        reviewRequired: false,
    },
];
var ConsentType;
(function (ConsentType) {
    ConsentType["ESSENTIAL"] = "ESSENTIAL";
    ConsentType["ANALYTICS"] = "ANALYTICS";
    ConsentType["MARKETING"] = "MARKETING";
    ConsentType["PERSONALIZATION"] = "PERSONALIZATION";
    ConsentType["THIRD_PARTY_SHARING"] = "THIRD_PARTY_SHARING";
})(ConsentType || (exports.ConsentType = ConsentType = {}));
//# sourceMappingURL=data-classification.js.map
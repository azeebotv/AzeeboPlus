"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentType = exports.PiiCategory = exports.DataClassification = exports.validateNoPlaceholders = exports.isPlaceholderSecret = exports.validateStartup = exports.getPricing = exports.validateEnvironment = exports.environmentSchema = exports.DEFAULT_API_VERSION = exports.API_VERSION_METADATA_KEY = exports.API_VERSION_HEADER = exports.createVersionedResponse = exports.ApiVersioningConfig = exports.createCircuitBreaker = exports.CircuitState = exports.CircuitBreakerOpenError = exports.CircuitBreaker = exports.createNoContentResponse = exports.createCreatedResponse = exports.createPaginatedResponse = exports.createErrorResponse = exports.createSuccessResponse = exports.ApiResponseWrapper = exports.ROLE_PERMISSIONS = exports.PERMISSIONS_KEY = void 0;
exports.PERMISSIONS_KEY = 'permissions';
exports.ROLE_PERMISSIONS = {
    user: ['user:read', 'content:read'],
    creator: ['user:read', 'user:write', 'content:read', 'content:write', 'analytics:view'],
    moderator: [
        'user:read',
        'user:write',
        'content:read',
        'content:write',
        'content:moderate',
        'analytics:view',
    ],
    admin: [
        'user:read',
        'user:write',
        'user:manage',
        'content:read',
        'content:write',
        'content:moderate',
        'analytics:view',
        'analytics:export',
        'payment:view',
        'payment:refund',
        'admin:access',
        'settings:read',
        'settings:write',
    ],
    super_admin: [
        'user:read',
        'user:write',
        'user:manage',
        'content:read',
        'content:write',
        'content:moderate',
        'analytics:view',
        'analytics:export',
        'payment:view',
        'payment:refund',
        'admin:access',
        'settings:read',
        'settings:write',
    ],
    partner: ['analytics:view', 'analytics:export'],
    sponsor_manager: ['analytics:view'],
};
var api_response_1 = require("./api-response");
Object.defineProperty(exports, "ApiResponseWrapper", { enumerable: true, get: function () { return api_response_1.ApiResponseWrapper; } });
Object.defineProperty(exports, "createSuccessResponse", { enumerable: true, get: function () { return api_response_1.createSuccessResponse; } });
Object.defineProperty(exports, "createErrorResponse", { enumerable: true, get: function () { return api_response_1.createErrorResponse; } });
Object.defineProperty(exports, "createPaginatedResponse", { enumerable: true, get: function () { return api_response_1.createPaginatedResponse; } });
Object.defineProperty(exports, "createCreatedResponse", { enumerable: true, get: function () { return api_response_1.createCreatedResponse; } });
Object.defineProperty(exports, "createNoContentResponse", { enumerable: true, get: function () { return api_response_1.createNoContentResponse; } });
var circuit_breaker_1 = require("./circuit-breaker");
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return circuit_breaker_1.CircuitBreaker; } });
Object.defineProperty(exports, "CircuitBreakerOpenError", { enumerable: true, get: function () { return circuit_breaker_1.CircuitBreakerOpenError; } });
Object.defineProperty(exports, "CircuitState", { enumerable: true, get: function () { return circuit_breaker_1.CircuitState; } });
Object.defineProperty(exports, "createCircuitBreaker", { enumerable: true, get: function () { return circuit_breaker_1.createCircuitBreaker; } });
var api_versioning_1 = require("./api-versioning");
Object.defineProperty(exports, "ApiVersioningConfig", { enumerable: true, get: function () { return api_versioning_1.ApiVersioningConfig; } });
Object.defineProperty(exports, "createVersionedResponse", { enumerable: true, get: function () { return api_versioning_1.createVersionedResponse; } });
Object.defineProperty(exports, "API_VERSION_HEADER", { enumerable: true, get: function () { return api_versioning_1.API_VERSION_HEADER; } });
Object.defineProperty(exports, "API_VERSION_METADATA_KEY", { enumerable: true, get: function () { return api_versioning_1.API_VERSION_METADATA_KEY; } });
Object.defineProperty(exports, "DEFAULT_API_VERSION", { enumerable: true, get: function () { return api_versioning_1.DEFAULT_API_VERSION; } });
var env_validation_1 = require("./env-validation");
Object.defineProperty(exports, "environmentSchema", { enumerable: true, get: function () { return env_validation_1.environmentSchema; } });
Object.defineProperty(exports, "validateEnvironment", { enumerable: true, get: function () { return env_validation_1.validateEnvironment; } });
var pricing_1 = require("./pricing");
Object.defineProperty(exports, "getPricing", { enumerable: true, get: function () { return pricing_1.getPricing; } });
var secret_validation_1 = require("./secret-validation");
Object.defineProperty(exports, "validateStartup", { enumerable: true, get: function () { return secret_validation_1.validateStartup; } });
Object.defineProperty(exports, "isPlaceholderSecret", { enumerable: true, get: function () { return secret_validation_1.isPlaceholderSecret; } });
Object.defineProperty(exports, "validateNoPlaceholders", { enumerable: true, get: function () { return secret_validation_1.validateNoPlaceholders; } });
var data_classification_1 = require("./data-classification");
Object.defineProperty(exports, "DataClassification", { enumerable: true, get: function () { return data_classification_1.DataClassification; } });
Object.defineProperty(exports, "PiiCategory", { enumerable: true, get: function () { return data_classification_1.PiiCategory; } });
Object.defineProperty(exports, "ConsentType", { enumerable: true, get: function () { return data_classification_1.ConsentType; } });
//# sourceMappingURL=index.js.map
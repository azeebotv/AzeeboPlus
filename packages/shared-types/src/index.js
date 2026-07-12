"use strict";
// Standard API Response Type (BE-005)
// NOTE: ApiResponse<T> and ApiError are defined in api-response-types.ts and re-exported below.
// ApiResponse<T>: { success, data?, error?: ApiError, meta?: PaginationMeta }
// ApiError: { code, message, details? }
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentType = exports.PiiCategory = exports.DataClassification = exports.validateNoPlaceholders = exports.isPlaceholderSecret = exports.validateStartup = exports.getPricing = exports.validateEnvironment = exports.environmentSchema = exports.DEFAULT_API_VERSION = exports.API_VERSION_METADATA_KEY = exports.API_VERSION_HEADER = exports.createVersionedResponse = exports.ApiVersioningConfig = exports.createCircuitBreaker = exports.CircuitState = exports.CircuitBreakerOpenError = exports.CircuitBreaker = exports.createNoContentResponse = exports.createCreatedResponse = exports.createPaginatedResponse = exports.createErrorResponse = exports.createSuccessResponse = exports.ApiResponseWrapper = exports.ROLE_PERMISSIONS = exports.PERMISSIONS_KEY = void 0;
exports.PERMISSIONS_KEY = 'permissions';
/** Maps each user role to its default set of permissions. */
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
/** Wrapper factory and helpers for building consistent API responses. */
var api_response_1 = require("./api-response");
Object.defineProperty(exports, "ApiResponseWrapper", { enumerable: true, get: function () { return api_response_1.ApiResponseWrapper; } });
/** Creates a successful API response with data. */
Object.defineProperty(exports, "createSuccessResponse", { enumerable: true, get: function () { return api_response_1.createSuccessResponse; } });
/** Creates an error API response with an ApiError. */
Object.defineProperty(exports, "createErrorResponse", { enumerable: true, get: function () { return api_response_1.createErrorResponse; } });
/** Creates a paginated API response with meta. */
Object.defineProperty(exports, "createPaginatedResponse", { enumerable: true, get: function () { return api_response_1.createPaginatedResponse; } });
/** Creates a 201 Created API response. */
Object.defineProperty(exports, "createCreatedResponse", { enumerable: true, get: function () { return api_response_1.createCreatedResponse; } });
/** Creates a 204 No Content API response. */
Object.defineProperty(exports, "createNoContentResponse", { enumerable: true, get: function () { return api_response_1.createNoContentResponse; } });
// Circuit Breaker types and utilities
/** Circuit breaker for preventing cascading failures in service calls. */
var circuit_breaker_1 = require("./circuit-breaker");
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return circuit_breaker_1.CircuitBreaker; } });
Object.defineProperty(exports, "CircuitBreakerOpenError", { enumerable: true, get: function () { return circuit_breaker_1.CircuitBreakerOpenError; } });
Object.defineProperty(exports, "CircuitState", { enumerable: true, get: function () { return circuit_breaker_1.CircuitState; } });
Object.defineProperty(exports, "createCircuitBreaker", { enumerable: true, get: function () { return circuit_breaker_1.createCircuitBreaker; } });
// API Versioning types and utilities
var api_versioning_1 = require("./api-versioning");
Object.defineProperty(exports, "ApiVersioningConfig", { enumerable: true, get: function () { return api_versioning_1.ApiVersioningConfig; } });
Object.defineProperty(exports, "createVersionedResponse", { enumerable: true, get: function () { return api_versioning_1.createVersionedResponse; } });
Object.defineProperty(exports, "API_VERSION_HEADER", { enumerable: true, get: function () { return api_versioning_1.API_VERSION_HEADER; } });
Object.defineProperty(exports, "API_VERSION_METADATA_KEY", { enumerable: true, get: function () { return api_versioning_1.API_VERSION_METADATA_KEY; } });
Object.defineProperty(exports, "DEFAULT_API_VERSION", { enumerable: true, get: function () { return api_versioning_1.DEFAULT_API_VERSION; } });
// Environment Validation
var env_validation_1 = require("./env-validation");
Object.defineProperty(exports, "environmentSchema", { enumerable: true, get: function () { return env_validation_1.environmentSchema; } });
Object.defineProperty(exports, "validateEnvironment", { enumerable: true, get: function () { return env_validation_1.validateEnvironment; } });
// Pricing constants and utilities
var pricing_1 = require("./pricing");
Object.defineProperty(exports, "getPricing", { enumerable: true, get: function () { return pricing_1.getPricing; } });
// Secret Validation
/** Validates environment variables and secrets at service startup. */
var secret_validation_1 = require("./secret-validation");
Object.defineProperty(exports, "validateStartup", { enumerable: true, get: function () { return secret_validation_1.validateStartup; } });
Object.defineProperty(exports, "isPlaceholderSecret", { enumerable: true, get: function () { return secret_validation_1.isPlaceholderSecret; } });
Object.defineProperty(exports, "validateNoPlaceholders", { enumerable: true, get: function () { return secret_validation_1.validateNoPlaceholders; } });
// Data Classification types
var data_classification_1 = require("./data-classification");
Object.defineProperty(exports, "DataClassification", { enumerable: true, get: function () { return data_classification_1.DataClassification; } });
Object.defineProperty(exports, "PiiCategory", { enumerable: true, get: function () { return data_classification_1.PiiCategory; } });
Object.defineProperty(exports, "ConsentType", { enumerable: true, get: function () { return data_classification_1.ConsentType; } });

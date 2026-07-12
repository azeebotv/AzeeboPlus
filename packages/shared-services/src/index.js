"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaModule = exports.PrismaService = exports.AuditLog = exports.AuditInterceptor = exports.AuditModule = exports.AuditService = exports.ApiVersion = exports.AnalyticsModule = exports.AnalyticsService = exports.SanitizeModule = exports.SanitizeInterceptor = exports.Pagination = exports.RequestValidationMiddleware = exports.ContentTypeMiddleware = exports.RedisModule = exports.RedisService = void 0;
// Redis
/** NestJS wrapper around the ioredis client with lifecycle management. */
var redis_service_1 = require("./redis/redis.service");
Object.defineProperty(exports, "RedisService", { enumerable: true, get: function () { return redis_service_1.RedisService; } });
/** NestJS module that provides RedisService globally. */
var redis_module_1 = require("./redis/redis.module");
Object.defineProperty(exports, "RedisModule", { enumerable: true, get: function () { return redis_module_1.RedisModule; } });
// Cache
/** Cache service, module, and interceptors for response caching. */
__exportStar(require("./cache"), exports);
// Middleware
/** Middleware that enforces allowed Content-Type headers on requests. */
var content_type_middleware_1 = require("./middleware/content-type.middleware");
Object.defineProperty(exports, "ContentTypeMiddleware", { enumerable: true, get: function () { return content_type_middleware_1.ContentTypeMiddleware; } });
/** Middleware that validates request body/query against DTO schemas. */
var request_validation_middleware_1 = require("./middleware/request-validation.middleware");
Object.defineProperty(exports, "RequestValidationMiddleware", { enumerable: true, get: function () { return request_validation_middleware_1.RequestValidationMiddleware; } });
// Pagination
/** Decorator that extracts and applies pagination parameters to a route. */
var pagination_decorator_1 = require("./pagination/pagination.decorator");
Object.defineProperty(exports, "Pagination", { enumerable: true, get: function () { return pagination_decorator_1.Pagination; } });
// Sanitize
/** Interceptor that strips sensitive fields from response payloads. */
var sanitize_interceptor_1 = require("./sanitize/sanitize.interceptor");
Object.defineProperty(exports, "SanitizeInterceptor", { enumerable: true, get: function () { return sanitize_interceptor_1.SanitizeInterceptor; } });
/** NestJS module providing the SanitizeInterceptor. */
var sanitize_module_1 = require("./sanitize/sanitize.module");
Object.defineProperty(exports, "SanitizeModule", { enumerable: true, get: function () { return sanitize_module_1.SanitizeModule; } });
// Analytics
/** Server-side analytics event tracking service. */
var analytics_service_1 = require("./analytics/analytics.service");
Object.defineProperty(exports, "AnalyticsService", { enumerable: true, get: function () { return analytics_service_1.AnalyticsService; } });
/** NestJS module providing AnalyticsService. */
var analytics_module_1 = require("./analytics/analytics.module");
Object.defineProperty(exports, "AnalyticsModule", { enumerable: true, get: function () { return analytics_module_1.AnalyticsModule; } });
// API Versioning
/** Decorator to specify the API version for a route handler. */
var api_version_decorator_1 = require("./api-versioning/api-version.decorator");
Object.defineProperty(exports, "ApiVersion", { enumerable: true, get: function () { return api_version_decorator_1.ApiVersion; } });
// Auth
/** Auth guards, decorators, and utilities for NestJS services. */
__exportStar(require("./auth"), exports);
// Audit
/** Audit logging service, module, interceptor, and decorator. */
var audit_service_1 = require("./audit/audit.service");
Object.defineProperty(exports, "AuditService", { enumerable: true, get: function () { return audit_service_1.AuditService; } });
var audit_module_1 = require("./audit/audit.module");
Object.defineProperty(exports, "AuditModule", { enumerable: true, get: function () { return audit_module_1.AuditModule; } });
var audit_interceptor_1 = require("./audit/audit.interceptor");
Object.defineProperty(exports, "AuditInterceptor", { enumerable: true, get: function () { return audit_interceptor_1.AuditInterceptor; } });
var audit_decorator_1 = require("./audit/audit.decorator");
Object.defineProperty(exports, "AuditLog", { enumerable: true, get: function () { return audit_decorator_1.AuditLog; } });
// Prisma
/** Prisma ORM service and module for database access. */
var prisma_service_1 = require("./prisma/prisma.service");
Object.defineProperty(exports, "PrismaService", { enumerable: true, get: function () { return prisma_service_1.PrismaService; } });
var prisma_module_1 = require("./prisma/prisma.module");
Object.defineProperty(exports, "PrismaModule", { enumerable: true, get: function () { return prisma_module_1.PrismaModule; } });

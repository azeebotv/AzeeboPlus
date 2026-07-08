// Redis
/** NestJS wrapper around the ioredis client with lifecycle management. */
export { RedisService } from './redis/redis.service';
/** NestJS module that provides RedisService globally. */
export { RedisModule } from './redis/redis.module';

// Cache
/** Cache service, module, and interceptors for response caching. */
export * from './cache';

// Middleware
/** Middleware that enforces allowed Content-Type headers on requests. */
export { ContentTypeMiddleware } from './middleware/content-type.middleware';
/** Middleware that validates request body/query against DTO schemas. */
export { RequestValidationMiddleware } from './middleware/request-validation.middleware';

// Pagination
/** Decorator that extracts and applies pagination parameters to a route. */
export { Pagination } from './pagination/pagination.decorator';

// Sanitize
/** Interceptor that strips sensitive fields from response payloads. */
export { SanitizeInterceptor } from './sanitize/sanitize.interceptor';
/** NestJS module providing the SanitizeInterceptor. */
export { SanitizeModule } from './sanitize/sanitize.module';

// Analytics
/** Server-side analytics event tracking service. */
export { AnalyticsService } from './analytics/analytics.service';
/** NestJS module providing AnalyticsService. */
export { AnalyticsModule } from './analytics/analytics.module';

// API Versioning
/** Decorator to specify the API version for a route handler. */
export { ApiVersion } from './api-versioning/api-version.decorator';

// Auth
/** Auth guards, decorators, and utilities for NestJS services. */
export * from './auth';

// Audit
/** Audit logging service, module, interceptor, and decorator. */
export { AuditService } from './audit/audit.service';
export { AuditModule } from './audit/audit.module';
export { AuditInterceptor } from './audit/audit.interceptor';
export { Audit } from './audit/audit.decorator';

// Prisma
/** Prisma ORM service and module for database access. */
export { PrismaService } from './prisma/prisma.service';
export { PrismaModule } from './prisma/prisma.module';

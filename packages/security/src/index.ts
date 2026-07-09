/** Configures CORS options for NestJS applications. */
export { configureCors, CorsOptions } from './cors.config';

/** NestJS module and config for Redis-backed rate limiting. */
export { RateLimiterModule, RateLimiterModuleConfig } from './rate-limiter/rate-limiter.module';

/** Guard and decorator for applying per-route rate limits. */
export { RateLimitGuard, RateLimit } from './rate-limiter/rate-limit.guard';

/** Rate limit evaluation service, config, and result types. */
export {
  RateLimitService,
  RateLimitConfig,
  RateLimitResult,
} from './rate-limiter/rate-limit.service';

/** Helmet security headers configuration factory and defaults. */
export {
  createHelmetConfig,
  SecurityHeadersConfig,
  defaultSecurityHeadersConfig,
} from './helmet.config';

/** Middleware that attaches a unique X-Request-Id to every request. */
export { RequestIdMiddleware } from './request-id.middleware';

/** Guard that restricts access to admin and super_admin roles. */
export { AdminGuard, AdminGuardOptions } from './guards/admin.guard';

/** Guard that validates internal service-to-service API keys. */
export { ServiceAuthGuard } from './guards/service-auth.guard';

/** Guard that checks user permissions against required permission set. */
export { PermissionsGuard } from './guards/permissions.guard';

/** Guard that enforces idempotency keys on mutating requests. */
export { IdempotencyGuard } from './guards/idempotency.guard';

/** Decorator to specify required permissions for a route handler. */
export { Permissions } from './decorators/permissions.decorator';

/** Decorator to mark a route as publicly accessible (no auth required). */
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';

/** Metadata key for storing permissions on route handlers. */
export { PERMISSIONS_KEY } from '@azeebo/shared-types';

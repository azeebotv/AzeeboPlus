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

/** Guard for internal service-to-service routes that carry no user identity:
 * authenticates the caller via the shared secret (GATEWAY_SECRET, falling
 * back to INTERNAL_API_KEY) sent in the x-internal-api-key header. */
export { InternalSecretGuard } from './guards/internal-secret.guard';

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

/** WebSocket origin validation for cross-site WebSocket hijacking prevention. */
export {
  createWebSocketCorsConfig,
  isOriginAllowed,
  getWebSocketOrigins,
} from './websocket-origin.validator';

// ============================================================================
// Security Services (TAA §49-56, §82-86)
// ============================================================================

/** Data classification labels and access control (TAA §51). */
export {
  DataClassificationService,
  DataClassification,
  ClassificationLabel,
  CLASSIFICATION_REGISTRY,
} from './classification/data-classification.service';

/** Break-glass access system with time-bound elevation (TAA §86). */
export {
  BreakGlassService,
  BreakGlassSession,
  BreakGlassReason,
  BreakGlassActivationRequest,
} from './break-glass/break-glass.service';

/** Redis-backed break-glass service for production/E2E use. */
export { BreakGlassRedisService } from './break-glass/break-glass-redis.service';

/** Dual-control approval for high-risk admin actions (TAA §55). */
export {
  DualControlService,
  DualControlRequest,
  DualControlApproval,
  DualControlAction,
} from './dual-control/dual-control.service';

/** Database-backed dual-control service for production/E2E use. */
export { DualControlDbService } from './dual-control/dual-control-db.service';

/** Sensitive log field redaction (TAA §52). */
export { LogRedactionService } from './log-redaction/log-redaction.service';

/** Account merge preserving purchase/history (TAA §49). */
export {
  AccountMergeService,
  AccountMergeRequest,
  MergeStatus,
} from './account-merge/account-merge.service';

/** Emergency rights kill path (TAA §82). */
export {
  RightsKillService,
  RightsKillOrder,
  RightsKillTrigger,
  RightsKillScope,
} from './rights-kill/rights-kill.service';

/** Immutable audit log with hash chain integrity (TAA §56). */
export {
  ImmutableAuditService,
  ImmutableAuditEntry,
} from './audit-immutable/immutable-audit.service';

/** Database-backed immutable audit log for production/E2E use. */
export { ImmutableAuditDbService } from './audit-immutable/immutable-audit-db.service';

/** MFA enforcement guard for admin actions (TAA §49). */
export { MfaGuard, RequiresMFA, REQUIRES_MFA_KEY } from './mfa/mfa-guard.service';

// ============================================================================
// Security Module — Import this to get all security services
// ============================================================================

/**
 * Global NestJS module providing all security services.
 * Import once in your root module or feature modules.
 */
export { mapErrorToHttpException, mapAndThrow } from './error-mapping/error-mapping';
export { SecurityModule } from './security.module';

/**
 * Re-export HealthCheckService from @azeebo/shared-services.
 * @azeebo/observability depends on @azeebo/shared-services, so this is safe.
 *
 * Consolidation note: The canonical HealthCheckService lives in
 * @azeebo/shared-services. All services should import from there.
 * This re-export ensures backward compatibility for existing imports.
 */
export {
  HealthCheckService,
  HealthCheckResult,
  ComponentCheck,
  HealthMetrics,
} from '@azeebo/shared-services';

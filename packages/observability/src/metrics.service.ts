/**
 * Re-export MetricsService from @azeebo/shared-services.
 * @azeebo/observability depends on @azeebo/shared-services, so this is safe.
 *
 * Consolidation note: The canonical MetricsService lives in
 * @azeebo/shared-services. All services should import from there.
 * This re-export ensures backward compatibility for existing imports.
 */
export {
  MetricsService,
  Metric,
  MetricValue,
  Counter,
  Gauge,
  Histogram,
} from '@azeebo/shared-services';

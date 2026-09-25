import { Controller, DynamicModule, Module, Type } from '@nestjs/common';
import { FlagMetricsController } from './flag-metrics.controller';
import { FlagMetricsService } from './flag-metrics.service';

export interface FlagMetricsModuleOptions {
  /** Prometheus `service` label value — e.g. 'auth-service', 'api-gateway'. */
  service: string;
  /**
   * HTTP path to serve the metrics at. Defaults to 'metrics' (/metrics).
   * Services that already own a `/metrics` route (payment/queue/search) pass
   * `path: 'flag-metrics'` so both endpoints coexist.
   */
  path?: string;
  /**
   * Analytics-service base URL for the payment-style `flag_stale_enabled`
   * event (per stale-enabled evaluation). Falls back to env
   * `ANALYTICS_SERVICE_URL`; unset → Prometheus counters only, no HTTP.
   */
  analyticsUrl?: string;
}

export const FLAG_METRICS_OPTIONS = 'FLAG_METRICS_OPTIONS';

@Module({})
export class FlagMetricsModule {
  static register(options: FlagMetricsModuleOptions): DynamicModule {
    const path = options.path ?? 'metrics';
    return {
      module: FlagMetricsModule,
      controllers: [createFlagMetricsController(path)],
      providers: [
        { provide: FLAG_METRICS_OPTIONS, useValue: options },
        {
          provide: FlagMetricsService,
          useFactory: (opts: FlagMetricsModuleOptions) =>
            new FlagMetricsService(opts.service, opts.analyticsUrl),
          inject: [FLAG_METRICS_OPTIONS],
        },
      ],
      exports: [FlagMetricsService],
    };
  }
}

/**
 * The controller is subclassed onto the configured path: the subclass carries
 * `@Controller(path)` metadata, which overrides the base 'metrics' path (NestJS
 * resolves controller metadata through the prototype chain, so the subclass's
 * own metadata wins). Handlers, @Public() and @ApiTags are inherited.
 */
export function createFlagMetricsController(path: string): Type<FlagMetricsController> {
  @Controller(path)
  class RoutedFlagMetricsController extends FlagMetricsController {}
  return RoutedFlagMetricsController;
}

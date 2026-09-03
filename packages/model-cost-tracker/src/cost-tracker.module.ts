import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CostTrackingInterceptor } from './cost-tracking.interceptor';
import { CostTrackerClient, type CostTrackerClientConfig } from './cost-tracker.client';

export const COST_TRACKER_CONFIG = 'cost_tracker_config';

/**
 * NestJS module for model cost tracking.
 *
 * Basic usage:
 * ```typescript
 * @Module({
 *   imports: [CostTrackerModule.forRoot({
 *     analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL,
 *     serviceName: 'my-service',
 *   })],
 * })
 * export class AppModule {}
 * ```
 *
 * This provides:
 * - CostTrackingInterceptor (install as APP_INTERCEPTOR for auto-tracking)
 * - CostTrackerClient (inject for manual tracking)
 * - Reflector (for decorator metadata)
 */
@Global()
@Module({})
export class CostTrackerModule {
  static forRoot(config: CostTrackerClientConfig): DynamicModule {
    const configProvider: Provider = {
      provide: COST_TRACKER_CONFIG,
      useValue: config,
    };

    const clientProvider: Provider = {
      provide: CostTrackerClient,
      useFactory: (cfg: CostTrackerClientConfig) => new CostTrackerClient(cfg),
      inject: [COST_TRACKER_CONFIG],
    };

    return {
      module: CostTrackerModule,
      providers: [configProvider, clientProvider, CostTrackingInterceptor, Reflector],
      exports: [CostTrackerClient, CostTrackingInterceptor],
    };
  }

  /**
   * For async configuration (e.g. from ConfigService).
   */
  static forRootAsync(options: {
    useFactory: (...args: unknown[]) => CostTrackerClientConfig;
    inject?: (string | symbol)[];
  }): DynamicModule {
    const clientProvider: Provider = {
      provide: CostTrackerClient,
      useFactory: (config: CostTrackerClientConfig) => new CostTrackerClient(config),
      inject: [COST_TRACKER_CONFIG],
    };

    return {
      module: CostTrackerModule,
      providers: [
        {
          provide: COST_TRACKER_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        clientProvider,
        CostTrackingInterceptor,
        Reflector,
      ],
      exports: [CostTrackerClient, CostTrackingInterceptor],
    };
  }
}

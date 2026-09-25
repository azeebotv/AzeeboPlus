import { Module, OnModuleInit, Global } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { HttpMetricsService } from './http-metrics.service';
import { HttpMetricsController } from './http-metrics.controller';

/**
 * Mounts gateway HTTP/rate-limit observability:
 * - instrumentation middleware registered straight on the Express instance
 *   (before route matching, so proxied requests are counted too)
 * - GET /metrics/http Prometheus exposition (the admin backend scrapes this
 *   and serves an aggregated JSON view to the Rate Limits / Performance
 *   pages — the browser never queries the gateway directly).
 */
@Global()
@Module({
  providers: [HttpMetricsService],
  controllers: [HttpMetricsController],
  exports: [HttpMetricsService],
})
export class HttpMetricsModule implements OnModuleInit {
  constructor(
    private readonly httpMetrics: HttpMetricsService,
    private readonly adapterHost: HttpAdapterHost
  ) {}

  onModuleInit(): void {
    const app = this.adapterHost.httpAdapter?.getInstance?.();
    if (app && typeof app.use === 'function') {
      app.use(this.httpMetrics.expressMiddleware());
    }
  }
}

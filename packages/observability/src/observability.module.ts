import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { TracingService } from './tracing.service';
import { HealthCheckService } from './health-check.service';

@Global()
@Module({
  providers: [MetricsService, TracingService, HealthCheckService],
  exports: [MetricsService, TracingService, HealthCheckService],
})
export class ObservabilityModule {}

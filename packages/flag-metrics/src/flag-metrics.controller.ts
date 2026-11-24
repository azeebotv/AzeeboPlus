import { Inject, Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { FlagMetricsService } from './flag-metrics.service';

/**
 * Serves the service's flag-metrics exposition. The route is public so
 * Prometheus can scrape it without auth; the effective path is set by
 * FlagMetricsModule.register({ path }) via a subclassed controller.
 */
@Public()
@ApiTags('Metrics')
@Controller('metrics')
export class FlagMetricsController {
  constructor(@Inject(FlagMetricsService) private readonly metricsService: FlagMetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}

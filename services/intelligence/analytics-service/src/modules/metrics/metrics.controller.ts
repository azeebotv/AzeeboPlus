import { Inject, Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { MetricsService } from './metrics.service.js';

@Public()
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(@Inject(MetricsService) private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}

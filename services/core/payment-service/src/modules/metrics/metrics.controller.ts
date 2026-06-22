import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { MetricsService } from './metrics.service';

@Public()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}

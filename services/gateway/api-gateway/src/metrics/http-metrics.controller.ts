import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@azeebo/security';
import { HttpMetricsService } from './http-metrics.service';

/**
 * Serves the HTTP/rate-limit Prometheus registry at GET /metrics/http.
 * Deliberately a separate path from the shared flag-metrics /metrics mount
 * so the two registries stay independent. Public like every other metrics
 * endpoint — scrapers (the admin backend) carry no user tokens.
 */
@Public()
@Controller('metrics')
export class HttpMetricsController {
  constructor(private readonly httpMetrics: HttpMetricsService) {}

  @Get('http')
  async getHttpMetrics(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(await this.httpMetrics.getMetrics());
  }
}

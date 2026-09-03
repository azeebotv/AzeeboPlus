import { Controller, Get, Header } from '@nestjs/common';
import { metrics } from './metrics.interceptor.js';

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): string {
    return metrics.formatPrometheus();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  getReady(): { status: string; checks: Record<string, string> } {
    return {
      status: 'ready',
      checks: {
        memory: this.checkMemory(),
        uptime: process.uptime() > 0 ? 'ok' : 'error',
      },
    };
  }

  private checkMemory(): string {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    return heapUsedMB < 512 ? 'ok' : 'warning';
  }
}

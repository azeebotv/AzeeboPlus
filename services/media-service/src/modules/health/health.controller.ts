import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, DiskHealthIndicator } from '@nestjs/terminus';
import { join } from 'path';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: join(process.cwd(), 'uploads') }),
    ]);
  }

  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}

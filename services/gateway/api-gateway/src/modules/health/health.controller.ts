import { Controller, Get } from '@nestjs/common';
import { Public } from '@azeebo/security';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';

@Controller()
@Public()
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        apiGateway: {
          status: 'up',
          timestamp: new Date().toISOString(),
        },
      }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  checkReady(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        apiGateway: {
          status: 'up',
          timestamp: new Date().toISOString(),
        },
      }),
    ]);
  }

  @Get('live')
  @HealthCheck()
  checkLive(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        apiGateway: {
          status: 'up',
          timestamp: new Date().toISOString(),
        },
      }),
    ]);
  }
}

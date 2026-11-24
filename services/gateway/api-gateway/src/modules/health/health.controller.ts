import { Inject, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller()
@Public()
export class HealthController {
  constructor(@Inject(HealthCheckService) private health: HealthCheckService) {}

  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        apiGateway: {
          status: 'up',
          timestamp: new Date().toISOString(),
          commitSha: process.env.COMMIT_SHA || process.env.GIT_SHA || 'dev',
        },
      }),
    ]);
  }

  @Get('version')
  version() {
    return {
      commitSha: process.env.COMMIT_SHA || process.env.GIT_SHA || 'dev',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
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

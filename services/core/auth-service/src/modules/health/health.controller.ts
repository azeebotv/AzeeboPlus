import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '@azeebo/security';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { db: { status: 'up' } };
        } catch (error) {
          this.logger.debug(`Health check failed: ${error instanceof Error ? error.message : 'unknown'}`);
          return { db: { status: 'down' } };
        }
      },
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe - checks if service is running' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - checks dependencies' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { db: { status: 'up' } };
        } catch (error) {
          this.logger.debug(`Readiness check failed: ${error instanceof Error ? error.message : 'unknown'}`);
          return { db: { status: 'down' } };
        }
      },
    ]);
  }
}

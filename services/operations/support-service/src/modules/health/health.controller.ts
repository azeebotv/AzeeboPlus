import { Inject, Controller, Get  } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private health: HealthCheckService,
    @Inject(PrismaHealthIndicator) private prisma: PrismaHealthIndicator,
    @Inject(PrismaService) private prismaService: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([() => this.prisma.pingCheck('database', this.prismaService)]);
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
  readiness() {
    return this.health.check([() => this.prisma.pingCheck('database', this.prismaService)]);
  }
}

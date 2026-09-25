import { Inject, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service.js';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private health: HealthCheckService,
    @Inject(PrismaHealthIndicator) private prisma: PrismaHealthIndicator,
    @Inject(PrismaService) private prismaService: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prisma.pingCheck('database', this.prismaService)]);
  }

  @Get('ready')
  @HealthCheck()
  async ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prisma.pingCheck('database', this.prismaService)]);
  }

  @Get('live')
  async live(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

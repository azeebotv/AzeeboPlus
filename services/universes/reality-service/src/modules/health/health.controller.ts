import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private prismaService: PrismaService
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

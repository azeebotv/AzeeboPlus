import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service.js';

@Public()
@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService
  ) {}

  @Get('health')
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { db: { status: 'up' } };
        } catch {
          return { db: { status: 'down' } };
        }
      },
    ]);
  }

  @Get('ready')
  @HealthCheck()
  async checkReady(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { db: { status: 'up' } };
        } catch {
          return { db: { status: 'down' } };
        }
      },
    ]);
  }

  @Get('live')
  @HealthCheck()
  checkLive(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}

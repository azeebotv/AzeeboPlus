import { Inject, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import {
  HealthCheck,
  HealthCheckService,
  DiskHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { join } from 'path';
import { PrismaService } from '../database/prisma.service';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private health: HealthCheckService,
    @Inject(DiskHealthIndicator) private disk: DiskHealthIndicator,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.disk.checkStorage('storage', {
          thresholdPercent: 0.9,
          path: join(process.cwd(), 'uploads'),
        }),
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
  live(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
}

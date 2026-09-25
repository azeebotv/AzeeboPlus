import { Inject, Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';
import {
  HealthCheckResult,
  ComponentStatus,
  ExternalService,
} from './interfaces/health.interfaces.js';
import checkDiskSpace from 'check-disk-space';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly externalServices: ExternalService[] = [
    {
      name: 'payment_gateway_paystack',
      url: process.env.PAYSTACK_API_URL || 'https://api.paystack.co',
      // Unreachable gateways must fail FAST: this timeout bounds every
      // /health response, and anything ≥5s exceeds downstream probes' 4s
      // budget (Ops Health dials localhost → [::1] → 127.0.0.1 at 4s each).
      // 2s still leaves room for a healthy gateway's round trip.
      timeout: 2000,
    },
    {
      name: 'payment_gateway_flutterwave',
      url: process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.co',
      timeout: 2000,
    },
  ];

  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<HealthCheckResult> {
    const [database, memory, disk, external] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkExternalServices(),
    ]);

    const allHealthy =
      database.status === 'healthy' &&
      memory.status === 'healthy' &&
      disk.status === 'healthy' &&
      external.every((s) => s.status === 'healthy');

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        database,
        memory,
        disk,
        external,
      },
    };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<{
    status: string;
    timestamp: string;
    checks: {
      database: boolean;
      memory: boolean;
      external: Record<string, boolean>;
    };
  }> {
    const [database, memory, external] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkExternalServices(),
    ]);

    const isReady =
      database.status === 'healthy' &&
      memory.status === 'healthy' &&
      external.every((s) => s.status === 'healthy');

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: database.status === 'healthy',
        memory: memory.status === 'healthy',
        external: external.reduce(
          (acc, svc) => {
            acc[svc.name] = svc.status === 'healthy';
            return acc;
          },
          {} as Record<string, boolean>
        ),
      },
    };
  }

  private async checkDatabase(): Promise<ComponentStatus> {
    try {
      const start = Date.now();
      await this.prismaService.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
        message: 'Database connection active',
      };
    } catch (error: unknown) {
      throw new HttpException(
        { status: 'error', db: 'disconnected' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private async checkMemory(): Promise<ComponentStatus> {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);

    if (heapUsedPercent > 90) {
      return {
        status: 'unhealthy',
        message: `Heap usage critical: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsedPercent.toFixed(1)}%)`,
      };
    } else if (heapUsedPercent > 75) {
      return {
        status: 'degraded',
        message: `Heap usage elevated: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsedPercent.toFixed(1)}%)`,
      };
    }

    return {
      status: 'healthy',
      message: `Heap usage normal: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsedPercent.toFixed(1)}%)`,
    };
  }

  private async checkDisk(): Promise<ComponentStatus> {
    try {
      const diskSpace = await checkDiskSpace('/');

      const used = diskSpace.size - diskSpace.free;
      const usedPercent = (used / diskSpace.size) * 100;

      if (usedPercent > 95) {
        return {
          status: 'unhealthy',
          message: `Disk space critical: ${usedPercent.toFixed(1)}% used`,
        };
      } else if (usedPercent > 85) {
        return {
          status: 'degraded',
          message: `Disk space low: ${usedPercent.toFixed(1)}% used`,
        };
      }

      return {
        status: 'healthy',
        message: `Disk space available: ${usedPercent.toFixed(1)}% used`,
      };
    } catch {
      return {
        status: 'degraded',
        message: 'Disk space check unavailable',
      };
    }
  }

  private async checkExternalServices(): Promise<ExternalService[]> {
    const results = await Promise.all(
      this.externalServices.map(async (service) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), service.timeout);

          const start = Date.now();
          const response = await fetch(service.url, {
            method: 'HEAD',
            signal: controller.signal,
          });
          const latency = Date.now() - start;

          clearTimeout(timeoutId);

          return {
            ...service,
            status: response.ok ? 'healthy' : 'unhealthy',
            latency,
            message: response.ok ? 'Service reachable' : `HTTP ${response.status}`,
          } as ExternalService & {
            status: 'healthy' | 'unhealthy';
            latency: number;
            message: string;
          };
        } catch (error: unknown) {
          return {
            ...service,
            status: 'unhealthy' as const,
            latency: -1,
            message: error instanceof Error ? error.message : 'Connection failed',
          };
        }
      })
    );

    return results;
  }
}

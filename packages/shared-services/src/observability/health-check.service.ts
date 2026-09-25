import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  checks: ComponentCheck[];
  metrics?: HealthMetrics;
}

export interface ComponentCheck {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthMetrics {
  uptimeSeconds: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestCount: number;
  errorCount: number;
  lastError?: string;
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

/** Service for performing liveness, readiness, and component health checks. */
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime: number;
  private requestCount = 0;
  private errorCount = 0;
  private lastError?: string;

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly redisService?: RedisService
  ) {
    this.startTime = Date.now();
  }

  recordRequest(): void {
    this.requestCount++;
  }

  recordError(error: string): void {
    this.errorCount++;
    this.lastError = error;
  }

  async checkHealth(
    serviceName: string,
    version: string,
    checks: Array<{
      name: string;
      check: () => Promise<{
        status: 'up' | 'down' | 'degraded';
        message?: string;
        latencyMs?: number;
        metadata?: Record<string, unknown>;
      }>;
    }>
  ): Promise<HealthCheckResult> {
    const results = await Promise.all(
      checks.map(async (c) => {
        const start = Date.now();
        try {
          const result = await c.check();
          return {
            name: c.name,
            status: result.status,
            latencyMs: Date.now() - start,
            message: result.message,
            metadata: result.metadata,
          } as ComponentCheck;
        } catch (error) {
          return {
            name: c.name,
            status: 'down' as const,
            latencyMs: Date.now() - start,
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const overallStatus = this.calculateOverallStatus(results);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: serviceName,
      version,
      checks: results,
      metrics: this.getMetrics(),
    };
  }

  private calculateOverallStatus(checks: ComponentCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (checks.some((c) => c.status === 'down')) {
      return 'unhealthy';
    }

    if (checks.some((c) => c.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  private getMetrics(): HealthMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      memoryUsage: memUsage,
      cpuUsage,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      lastError: this.lastError,
    };
  }

  async checkDatabase(): Promise<{
    status: 'up' | 'down' | 'degraded';
    message?: string;
    latencyMs?: number;
  }> {
    if (!this.prisma) {
      return { status: 'up', latencyMs: 0, message: 'Prisma not configured' };
    }
    const start = Date.now();
    try {
      await (
        this.prisma as unknown as {
          $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
        }
      ).$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database unavailable',
        latencyMs: Date.now() - start,
      };
    }
  }

  async checkRedis(): Promise<{
    status: 'up' | 'down' | 'degraded';
    message?: string;
    latencyMs?: number;
  }> {
    const start = Date.now();

    if (!this.redisService) {
      return { status: 'up', latencyMs: 0, message: 'Redis not configured' };
    }

    try {
      const client = await this.redisService.getClient();
      const pong = await client.ping();
      if (pong === 'PONG') {
        return { status: 'up', latencyMs: Date.now() - start };
      }
      return {
        status: 'down',
        message: `Unexpected PING response: ${pong}`,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error as Error);
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Redis unavailable',
        latencyMs: Date.now() - start,
      };
    }
  }

  async checkExternalService(
    _name: string,
    url: string,
    timeoutMs = 5000
  ): Promise<{ status: 'up' | 'down' | 'degraded'; message?: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        method: 'HEAD',
      });

      if (response.ok) {
        return { status: 'up', latencyMs: Date.now() - start };
      }

      if (response.status >= 500) {
        return {
          status: 'down',
          message: `HTTP ${response.status}`,
          latencyMs: Date.now() - start,
        };
      }

      return {
        status: 'degraded',
        message: `HTTP ${response.status}`,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Service unavailable',
        latencyMs: Date.now() - start,
      };
    }
  }

  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async getReadiness(
    checks: Array<() => Promise<boolean>>
  ): Promise<{ status: 'ok' | 'error'; message?: string }> {
    const results = await Promise.all(checks.map((c) => c().catch(() => false)));

    if (results.every((r) => r)) {
      return { status: 'ok' };
    }

    const failedIndexes = results.map((r, i) => (!r ? i : -1)).filter((i) => i >= 0);
    return { status: 'error', message: `Failed checks: ${failedIndexes.join(', ')}` };
  }
}

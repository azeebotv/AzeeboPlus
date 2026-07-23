import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  uptime: number;
  timestamp: string;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const memory = process.memoryUsage();
    const uptime = (Date.now() - this.startTime) / 1000;

    const allUp = database.status === 'up' && redis.status === 'up';
    const allDown = database.status === 'down' && redis.status === 'down';

    return {
      status: allDown ? 'error' : allUp ? 'ok' : 'degraded',
      uptime,
      timestamp: new Date().toISOString(),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },
      services: { database, redis },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma._client.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const client = await this.redis.getClient();
      await client.ping();
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

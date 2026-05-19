import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: { status: 'healthy' | 'unhealthy'; error?: string };
    redis: { status: 'healthy' | 'unhealthy'; error?: string };
  };
}

export interface ReadinessResult {
  status: 'ready' | 'not_ready';
  timestamp: string;
  dependencies: {
    database: boolean;
    redis: boolean;
  };
}

export interface LivenessResult {
  status: 'alive' | 'dead';
  timestamp: string;
  uptime: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const databaseStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    const status: 'healthy' | 'unhealthy' = 
      databaseStatus.status === 'healthy' && redisStatus.status === 'healthy' 
        ? 'healthy' 
        : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };
  }

  async checkReadiness(): Promise<ReadinessResult> {
    const databaseReady = await this.isDatabaseReady();
    const redisReady = await this.isRedisReady();

    return {
      status: databaseReady && redisReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: databaseReady,
        redis: redisReady,
      },
    };
  }

  async checkLiveness(): Promise<LivenessResult> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private async checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkRedis(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
    try {
      const client = await this.redisService.getClient();
      const result = await client.ping();
      if (result !== 'PONG') {
        throw new Error('Redis ping failed');
      }
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async isRedisReady(): Promise<boolean> {
    try {
      const client = await this.redisService.getClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
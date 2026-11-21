import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface PoolHealthSummary {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connectedClients: number;
  maxClients: number;
  poolUtilizationPercent: number;
  directPgBypasses: number;
  lastChecked: string;
}

@Injectable()
export class DbPoolHealthService {
  private readonly logger = new Logger(DbPoolHealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPgbouncerHealth(): Promise<PoolHealthSummary> {
    try {
      const stats = (await this.prisma.$queryRawUnsafe(
        'SELECT count(*) as count FROM pg_stat_activity'
      )) as Array<{ count: bigint | number }>;

      const connectedClients = Number(stats[0]?.count ?? 1);
      const maxClients = 100;
      const utilization = Number(((connectedClients / maxClients) * 100).toFixed(1));

      return {
        status: utilization > 85 ? 'degraded' : 'healthy',
        connectedClients,
        maxClients,
        poolUtilizationPercent: utilization,
        directPgBypasses: 0,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`Database pool health check failed: ${err.message}`);
      return {
        status: 'unhealthy',
        connectedClients: 0,
        maxClients: 100,
        poolUtilizationPercent: 0,
        directPgBypasses: 0,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

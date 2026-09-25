import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../prisma/client/index.js';
import { SlowQueryLogger } from '@azeebo/shared-services';

// Create logger outside class to avoid "super() must be called before this" error
const slowQueryLogger = new SlowQueryLogger({
  slowQueryThresholdMs: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '500', 10),
  criticalQueryThresholdMs: parseInt(process.env.CRITICAL_QUERY_THRESHOLD_MS || '5000', 10),
  n1DetectionWindowMs: parseInt(process.env.N1_DETECTION_WINDOW_MS || '5000', 10),
  n1MinRepeats: parseInt(process.env.N1_MIN_REPEATS || '3', 10),
  enableN1Detection: process.env.N1_DETECTION_ENABLED !== 'false',
});

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /** Expose slow query logger for health checks and metrics endpoints */
  get queryMonitor(): SlowQueryLogger {
    return slowQueryLogger;
  }

  constructor() {
    const connectionLimit = parseInt(process.env.DB_POOL_SIZE || '10', 10);
    const poolTimeout = parseInt(process.env.DB_POOL_TIMEOUT || '10', 10);
    const idleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT || '5', 10);

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable must be set');
    }
    const databaseUrl = new URL(process.env.DATABASE_URL);
    databaseUrl.searchParams.set('connection_limit', connectionLimit.toString());
    databaseUrl.searchParams.set('pool_timeout', poolTimeout.toString());
    databaseUrl.searchParams.set('idle_timeout', idleTimeout.toString());

    super({
      datasourceUrl: databaseUrl.toString(),
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');

      // Wire Prisma query events to slow query + N+1 detector
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on(
        'query',
        (event: { query: string; duration: number; params: string; target: string }) => {
          // Parse model name from the Prisma query event target
          const modelMatch = event.target?.match(/^prisma::(?:\w+\.)?(\w+)/);
          const sqlModelMatch = event.query.match(/FROM\s+"?(\w+)"?/i);
          const model = modelMatch?.[1] || sqlModelMatch?.[1] || 'Unknown';

          slowQueryLogger.logQuery({
            model,
            operation: 'query',
            durationMs: event.duration,
            query: event.query,
          });
        }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}

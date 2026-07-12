import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../prisma/client/index.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

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
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${(error as Error).message}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}

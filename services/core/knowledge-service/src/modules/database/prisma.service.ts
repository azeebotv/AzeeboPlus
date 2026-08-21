import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

/**
 * PrismaService for knowledge-service.
 * In production, extend PrismaClient from the generated client.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  async onModuleInit() {
    // Connect to database in production
  }

  async onModuleDestroy() {
    // Disconnect in production
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

/**
 * Shared PrismaService used by AuditService and other shared modules.
 *
 * Uses composition (not inheritance) so the `require('@prisma/client')` only
 * runs inside the constructor — avoiding the module-load-time crash when
 * `.prisma/client` is missing from the pnpm store copy of `@prisma/client`.
 *
 * Each service also has its OWN PrismaService that extends the service-specific
 * generated client; this shared version exists solely so AuditService (and any
 * other shared module) can access the database without duplicating connection
 * logic.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  /** @internal – the underlying PrismaClient instance */
  readonly _client: Record<string, unknown>;

  constructor() {
    try {
      // Lazy require — only resolves at instantiation, not at module load.
      // This prevents the ".prisma/client/default" crash from propagating
      // through the shared-services barrel export.
      const { PrismaClient } = require('@prisma/client');
      this._client = new PrismaClient({
        log:
          process.env.NODE_ENV === 'production'
            ? ['error', 'warn']
            : ['query', 'error', 'info', 'warn'],
      });
    } catch (error) {
      this.logger.error('Failed to initialise PrismaClient', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle hooks (match the previous PrismaClient-based interface)
  // ---------------------------------------------------------------------------

  async onModuleInit() {
    try {
      await this._client.$connect();
      this.logger.log('Prisma client connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this._client.$disconnect();
      this.logger.log('Prisma client disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Prisma client:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // Delegate common PrismaClient properties so existing callers
  // (e.g. `this.prisma.auditLog.create(...)`) keep working.
  // ---------------------------------------------------------------------------

  get auditLog(): Record<string, unknown> {
    return this._client.auditLog as Record<string, unknown>;
  }

  /** Generic proxy – forwards any property access to the underlying client. */
  get [Symbol.iterator](): undefined {
    return undefined;
  }
}

// Allow `PrismaService` to be used as a PrismaClient type in places that
// expect the full client interface (e.g. `extends PrismaClient` in service-
// specific PrismaService classes).  At runtime the actual client is the
// service-specific generated one, not this shared wrapper.
export type PrismaServiceLike = InstanceType<typeof PrismaService> & Record<string, unknown>;

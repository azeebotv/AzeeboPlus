/**
 * Minimal interfaces for dynamically injected clients.
 * These replace `any` types used for PrismaClient and Redis
 * while keeping the security package free of heavy dependencies.
 */

/** Minimal Prisma client shape used by audit services */
export interface AuditPrismaClient {
  $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;
  auditLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findMany: (args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
      take?: number;
      skip?: number;
    }) => Promise<Record<string, unknown>[]>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
}

/** Minimal Redis client shape used by security services */
export interface AuditRedisClient {
  set: (key: string, value: string, ...args: unknown[]) => Promise<string | null>;
  get: (key: string) => Promise<string | null>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  sadd: (key: string, ...members: string[]) => Promise<number>;
  srem: (key: string, ...members: string[]) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  pipeline: () => RedisPipeline;
  multi: () => RedisPipeline;
}

/** Minimal pipeline abstraction */
export interface RedisPipeline {
  set: (key: string, value: string, ...args: unknown[]) => RedisPipeline;
  del: (...keys: string[]) => RedisPipeline;
  sadd: (key: string, ...members: string[]) => RedisPipeline;
  srem: (key: string, ...members: string[]) => RedisPipeline;
  expire: (key: string, seconds: number) => RedisPipeline;
  exec: () => Promise<[Error | null, unknown][]>;
}

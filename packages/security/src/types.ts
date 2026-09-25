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
    findFirst: (args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
    }) => Promise<Record<string, unknown> | null>;
    findUnique: (args: {
      where: Record<string, unknown>;
    }) => Promise<Record<string, unknown> | null>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  dualControlRequest: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findMany: (args?: {
      where?: Record<string, unknown>;
      include?: Record<string, boolean>;
      orderBy?: Record<string, string>;
    }) => Promise<Record<string, unknown>[]>;
    findUnique: (args: {
      where: Record<string, unknown>;
      include?: Record<string, boolean>;
    }) => Promise<Record<string, unknown> | null>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  dualControlApproval: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
  };
}

/** Minimal Redis client shape used by security services */
export interface AuditRedisClient {
  set: (key: string, value: string, ...args: unknown[]) => Promise<string | null>;
  setex: (key: string, seconds: number, value: string) => Promise<string | null>;
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

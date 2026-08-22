/**
 * Database Connection Pool Configuration
 * DB-006: Optimize PgBouncer settings
 */

export interface PoolConfig {
  min: number;
  max: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  acquireTimeoutMs: number;
}

export const POOL_CONFIGS: Record<string, PoolConfig> = {
  development: { min: 2, max: 10, idleTimeoutMs: 10000, connectionTimeoutMs: 5000, acquireTimeoutMs: 10000 },
  staging: { min: 5, max: 20, idleTimeoutMs: 30000, connectionTimeoutMs: 5000, acquireTimeoutMs: 15000 },
  production: { min: 10, max: 50, idleTimeoutMs: 60000, connectionTimeoutMs: 10000, acquireTimeoutMs: 30000 },
};

export function getPoolConfig(env: string = process.env.NODE_ENV || 'development'): PoolConfig {
  return POOL_CONFIGS[env] || POOL_CONFIGS.development;
}

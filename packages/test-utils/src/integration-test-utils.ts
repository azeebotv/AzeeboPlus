import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import Redis from 'ioredis-mock';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

export interface IntegrationTestConfig {
  postgresUrl: string;
  redisUrl: string;
  service: string;
}

export const DEFAULT_TEST_CONFIG: IntegrationTestConfig = {
  postgresUrl:
    process.env.TEST_POSTGRES_URL ||
    'postgresql://azeebo_test:azeebo_test_password@localhost:5433/azeebo_test_db',
  redisUrl: process.env.TEST_REDIS_URL || 'redis://redis_test_password@localhost:6380',
  service: 'test-service',
};

export interface TestContainer {
  id: string;
  name: string;
  stop: () => Promise<void>;
}

export class IntegrationTestEnvironment {
  private app: INestApplication | null = null;
  private prisma: PrismaClient | null = null;
  private redis: InstanceType<typeof Redis> | null = null;
  private containers: TestContainer[] = [];

  async startPostgres(): Promise<void> {
    // eslint-disable-next-line azeebo-custom/no-console-log, no-console -- test harness progress output
    console.log('Starting PostgreSQL test container...');
  }

  async startRedis(): Promise<void> {
    // eslint-disable-next-line azeebo-custom/no-console-log, no-console -- test harness progress output
    console.log('Starting Redis test container...');
    this.redis = new Redis();
  }

  async stop(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
    for (const container of this.containers) {
      await container.stop();
    }
    this.containers = [];
  }

  getRedis(): InstanceType<typeof Redis> | null {
    return this.redis;
  }

  getPrisma(): PrismaClient | null {
    return this.prisma;
  }

  async createApp(moduleFixture: TestingModule): Promise<INestApplication> {
    const app = moduleFixture.createNestApplication();
    await app.init();
    this.app = app;
    return app;
  }
}

export interface DatabaseTransaction {
  id: string;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

export class TransactionManager {
  private transactions: Map<string, DatabaseTransaction> = new Map();

  async beginTransaction(): Promise<DatabaseTransaction> {
    const id = randomUUID();
    const transaction: DatabaseTransaction = {
      id,
      commit: async () => {
        this.transactions.delete(id);
      },
      rollback: async () => {
        this.transactions.delete(id);
      },
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async commitAll(): Promise<void> {
    for (const transaction of this.transactions.values()) {
      await transaction.commit();
    }
    this.transactions.clear();
  }

  async rollbackAll(): Promise<void> {
    for (const transaction of this.transactions.values()) {
      await transaction.rollback();
    }
    this.transactions.clear();
  }
}

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  roles: string[];
}

export interface TestWallet {
  id: string;
  userId: string;
  balance: string;
  currency: string;
}

export interface TestPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
}

export class TestDataFactory {
  private transactionManager: TransactionManager;

  constructor(transactionManager?: TransactionManager) {
    this.transactionManager = transactionManager || new TransactionManager();
  }

  async createUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return {
      id: overrides.id || randomUUID(),
      email: overrides.email || `test_${randomUUID()}@example.com`,
      displayName: overrides.displayName || 'Test User',
      passwordHash: overrides.passwordHash || 'hashed_password',
      roles: overrides.roles || ['user'],
    };
  }

  async createWallet(userId: string, initialBalance = '100000'): Promise<TestWallet> {
    return {
      id: randomUUID(),
      userId,
      balance: initialBalance,
      currency: 'NGN',
    };
  }

  async createPayment(overrides: Partial<TestPayment> = {}): Promise<TestPayment> {
    return {
      id: randomUUID(),
      userId: overrides.userId || randomUUID(),
      amount: overrides.amount || 50000,
      currency: overrides.currency || 'NGN',
      status: overrides.status || 'pending',
      provider: overrides.provider || 'paystack',
    };
  }

  async cleanup(): Promise<void> {
    await this.transactionManager.rollbackAll();
  }
}

export async function withTransaction<T>(
  manager: TransactionManager,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = await manager.beginTransaction();
  try {
    const result = await fn();
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> {
  let lastError: Error | undefined;
  let delay = options.delayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < options.maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= options.backoffMultiplier;
      }
    }
  }

  throw lastError;
}

export function generateTestEmail(): string {
  return `test_${randomUUID()}@example.com`;
}

export function generateTestPhone(): string {
  return `+234${Math.floor(Math.random() * 900000000 + 100000000)}`;
}

export function generateTestPassword(): string {
  return `TestPass${randomUUID().slice(0, 8)}!`;
}

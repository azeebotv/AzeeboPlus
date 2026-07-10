import { randomUUID } from 'crypto';

export * from './integration-test-utils';

/** Test database wrapper providing setup, teardown, and seed helpers for integration tests. */
export class TestDatabase {
  private prisma: { $connect(): Promise<void>; $disconnect(): Promise<void>; $executeRawUnsafe(query: string): Promise<unknown> };

  constructor(prismaClient?: { $connect(): Promise<void>; $disconnect(): Promise<void>; $executeRawUnsafe(query: string): Promise<unknown> }) {
    this.prisma = prismaClient || {
      async $connect() { /* noop */ },
      async $disconnect() { /* noop */ },
      async $executeRawUnsafe() { /* noop */ },
    };
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async cleanDatabase(): Promise<void> {
    const tables = [
      'Vote',
      'WalletTransaction',
      'Payment',
      'Content',
      'User',
      'Wallet',
      'Notification',
      'AnalyticsEvent',
    ];

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(`DELETE FROM "${table}" CASCADE;`);
      } catch {
        // Table may not exist in this service's database — skip silently
      }
    }
  }
}

/** In-memory mock of the auth service for unit and integration tests. */
export class MockAuthService {
  private users: Map<string, { userId: string; roles: string[] }> = new Map();

  addUser(userId: string, roles: string[] = ['user']): void {
    this.users.set(userId, { userId, roles });
  }

  validateToken(token: string): { userId: string; roles: string[] } | null {
    return this.users.get(token) || null;
  }
}

/** In-memory mock of the wallet service for testing debit/credit flows. */
export class MockWalletService {
  private wallets: Map<string, { balance: number; userId: string }> = new Map();

  createWallet(userId: string, initialBalance: number = 100000): string {
    const walletId = randomUUID();
    this.wallets.set(walletId, { balance: initialBalance, userId });
    return walletId;
  }

  getBalance(walletId: string): number {
    return this.wallets.get(walletId)?.balance || 0;
  }

  debit(walletId: string, amount: number): boolean {
    const wallet = this.wallets.get(walletId);
    if (!wallet || wallet.balance < amount) return false;
    wallet.balance -= amount;
    return true;
  }

  credit(walletId: string, amount: number): void {
    const wallet = this.wallets.get(walletId);
    if (wallet) {
      wallet.balance += amount;
    }
  }
}

/**
 * Generates a base64-encoded token for test purposes only.
 * This is NOT a real JWT — it is a base64-encoded JSON object.
 * Do not use for security-sensitive tests that verify JWT signatures.
 */
export const generateTestJwt = (userId: string, roles: string[] = ['user']): string => {
  return Buffer.from(JSON.stringify({ userId, roles, exp: Date.now() + 3600000 })).toString(
    'base64'
  );
};

/** Generates a unique idempotency key for test requests. */
export const generateIdempotencyKey = (): string => {
  return randomUUID();
};

/** Creates a mock Axios response object for testing HTTP clients. */
export const mockAxiosResponse = <T>(data: T, status: number = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

/** Creates a full test context with database, auth, and wallet mocks plus setup/teardown. */
export const createTestContext = () => {
  const db = new TestDatabase();
  const auth = new MockAuthService();
  const wallet = new MockWalletService();

  return {
    db,
    auth,
    wallet,
    async setup(): Promise<void> {
      await db.connect();
      await db.cleanDatabase();
    },
    async teardown(): Promise<void> {
      await db.cleanDatabase();
      await db.disconnect();
    },
  };
};

/** Returns a sample user payload for test assertions. */
export function testUserPayload() {
  return {
    id: randomUUID(),
    email: 'test@example.com',
    displayName: 'Test User',
    roles: ['user'],
    createdAt: new Date().toISOString(),
  };
}

/** Returns a sample wallet payload for test assertions. */
export function testWalletPayload(userId?: string) {
  const uid = userId || testUserPayload().id;
  return {
    id: randomUUID(),
    userId: uid,
    balance: '100000',
    currency: 'NGN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Returns a sample vote payload for test assertions. */
export function testVotePayload(userId?: string) {
  const uid = userId || testUserPayload().id;
  return {
    id: randomUUID(),
    userId: uid,
    showId: randomUUID(),
    contestantId: randomUUID(),
    amount: 100,
    isSuperVote: false,
    createdAt: new Date().toISOString(),
  };
}

/** Returns a sample payment payload for test assertions. */
export function testPaymentPayload(userId?: string) {
  const uid = userId || testUserPayload().id;
  return {
    id: randomUUID(),
    userId: uid,
    amount: 50000,
    currency: 'NGN',
    status: 'completed',
    provider: 'paystack',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Returns a sample analytics event payload for test assertions. */
export function testAnalyticsEventPayload(userId?: string) {
  const uid = userId || testUserPayload().id;
  return {
    id: randomUUID(),
    eventName: 'screen_view',
    userId: uid,
    universe: 'reality',
    metadata: { screen: 'home' },
    timestamp: new Date().toISOString(),
  };
}

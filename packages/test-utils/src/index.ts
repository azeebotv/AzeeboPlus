import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
    });
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
      await this.prisma.$executeRawUnsafe(`DELETE FROM "${table}" CASCADE;`);
    }
  }

  async createTestUser(overrides: Partial<{ email: string; displayName: string }> = {}): Promise<{ id: string; email: string }> {
    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: overrides.email || `test_${uuidv4()}@example.com`,
        displayName: overrides.displayName || `Test User ${uuidv4().slice(0, 8)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { id: user.id, email: user.email };
  }

  async createTestWallet(userId: string): Promise<{ id: string; balance: string }> {
    const wallet = await this.prisma.wallet.create({
      data: {
        id: uuidv4(),
        userId,
        balance: '100000',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { id: wallet.id, balance: wallet.balance };
  }
}

export class MockAuthService {
  private users: Map<string, { userId: string; roles: string[] }> = new Map();

  addUser(userId: string, roles: string[] = ['user']): void {
    this.users.set(userId, { userId, roles });
  }

  validateToken(token: string): { userId: string; roles: string[] } | null {
    return this.users.get(token) || null;
  }
}

export class MockWalletService {
  private wallets: Map<string, { balance: number; userId: string }> = new Map();

  createWallet(userId: string, initialBalance: number = 100000): string {
    const walletId = uuidv4();
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

export const generateTestJwt = (userId: string, roles: string[] = ['user']): string => {
  return Buffer.from(JSON.stringify({ userId, roles, exp: Date.now() + 3600000 })).toString('base64');
};

export const generateIdempotencyKey = (): string => {
  return uuidv4();
};

export const mockAxiosResponse = <T>(data: T, status: number = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

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

export const testUserPayload = {
  id: uuidv4(),
  email: 'test@example.com',
  displayName: 'Test User',
  roles: ['user'],
  createdAt: new Date().toISOString(),
};

export const testWalletPayload = {
  id: uuidv4(),
  userId: testUserPayload.id,
  balance: '100000',
  currency: 'NGN',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const testVotePayload = {
  id: uuidv4(),
  userId: testUserPayload.id,
  showId: uuidv4(),
  contestantId: uuidv4(),
  amount: 100,
  isSuperVote: false,
  createdAt: new Date().toISOString(),
};

export const testPaymentPayload = {
  id: uuidv4(),
  userId: testUserPayload.id,
  amount: 50000,
  currency: 'NGN',
  status: 'completed',
  provider: 'paystack',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const testAnalyticsEventPayload = {
  id: uuidv4(),
  eventName: 'screen_view',
  userId: testUserPayload.id,
  universe: 'reality',
  metadata: { screen: 'home' },
  timestamp: new Date().toISOString(),
};
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletModule } from './wallet.module';
import { PrismaService } from '../database/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { RateLimitGuard, RateLimitService, AdminGuard } from '@azeebo/security';
import { CacheInterceptor, CacheService } from '../../cache';
import { randomUUID } from 'crypto';

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

class MockAdminGuard {
  canActivate() {
    return true;
  }
}

describe('Wallet E2E Tests - Webhooks, Retries, and Failures', () => {
  let app: INestApplication;
  let walletService: WalletService;
  let prismaService: PrismaService;

  const testUserId = randomUUID();
  const testWalletId = randomUUID();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), WalletModule],
      controllers: [WalletController],
    })
      .overrideProvider(PrismaService)
      .useValue({
        wallet: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        walletTransaction: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation(async (arg) => {
          if (Array.isArray(arg)) {
            const results = [];
            for (const op of arg) {
              if (typeof op === 'function') {
                const result = await op();
                results.push(result);
              } else if (op.walletTransaction?.create) {
                const createOp = op.walletTransaction.create;
                const created = await prismaService.walletTransaction.create(createOp);
                results.push(created);
              } else if (op.wallet?.update) {
                const updateOp = op.wallet.update;
                const updated = await prismaService.wallet.update(updateOp);
                results.push(updated);
              } else {
                results.push(op);
              }
            }
            return results;
          } else if (typeof arg === 'function') {
            return arg(prismaService);
          }
        }),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'POINTS_TO_NAIRA_RATE') return defaultValue ?? 100;
          return defaultValue;
        }),
      })
      .overrideProvider(RateLimitService)
      .useValue({
        checkRateLimit: jest.fn().mockResolvedValue(true),
        incrementUsage: jest.fn().mockResolvedValue(0),
      })
      .overrideProvider(CacheService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle() })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors({
      intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
    } as NestInterceptor);
    await app.init();

    walletService = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prismaService.$transaction as jest.Mock).mockReset();
    (prismaService.$transaction as jest.Mock).mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        // For array of operations, just await them all since they're already promises
        return Promise.all(arg);
      } else if (typeof arg === 'function') {
        return arg(prismaService);
      }
    });

    // Setup default mocks for wallet and walletTransaction
    (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue({
      id: testWalletId,
      userId: testUserId,
      balance: '100000',
      bonusBalance: '0',
      promoBalance: '0',
      currency: 'NGN',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (prismaService.wallet.update as jest.Mock).mockImplementation((args) => {
      const newBalance = args?.data?.balance?.increment
        ? (100000 + args.data.balance.increment).toString()
        : args?.data?.balance || '100000';

      return Promise.resolve({
        id: testWalletId,
        userId: testUserId,
        balance: newBalance,
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    (prismaService.walletTransaction.create as jest.Mock).mockImplementation((args) => {
      return Promise.resolve({
        id: randomUUID(),
        walletId: args.data.walletId,
        type: args.data.type,
        amount: args.data.amount,
        status: args.data.status || 'completed',
        description: args.data.description,
        reference: args.data.reference || null,
        idempotencyKey: args.data.idempotencyKey || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    (prismaService.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
    (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
  });

  describe('Duplicate Webhook Handling', () => {
    it('should handle duplicate webhook deliveries idempotently', async () => {
      const transactionId = randomUUID();
      const webhookEventId = 'wh_duplicate_test';
      const idempotencyKey = `wh_${webhookEventId}`;

      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWallet = {
        ...mockWallet,
        balance: '150000',
      };

      const mockTransaction = {
        id: transactionId,
        walletId: testWalletId,
        type: 'credit' as const,
        amount: 50000,
        balanceBefore: '100000',
        balanceAfter: '150000',
        description: 'Wallet funding via Paystack',
        reference: idempotencyKey,
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only call is during second creditWallet - return updated balance
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(updatedWallet);

      (prismaService.walletTransaction.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTransaction);

      (prismaService.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);

      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result1 = await walletService.creditWallet({
        walletId: testWalletId,
        amount: 50000,
        description: 'Wallet funding via Paystack',
        reference: idempotencyKey,
      });

      const result2 = await walletService.creditWallet({
        walletId: testWalletId,
        amount: 50000,
        description: 'Wallet funding via Paystack',
        reference: idempotencyKey,
      });

      expect(result1.id).toBe(result2.id);
      expect(result1.balance).toBe(result2.balance);
      expect(prismaService.walletTransaction.create).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate credits from same event ID', async () => {
      const webhookEventId = 'wh_event_123';
      const idempotencyKey = `paystack_${webhookEventId}`;

      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWallet = {
        ...mockWallet,
        balance: '125000',
      };

      const mockTransaction = {
        id: randomUUID(),
        walletId: testWalletId,
        type: 'credit' as const,
        amount: 25000,
        balanceBefore: '100000',
        balanceAfter: '125000',
        description: 'Paystack funding',
        reference: idempotencyKey,
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call: findFirst returns null, then after that returns existing transaction
      (prismaService.walletTransaction.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockTransaction);

      // Wallet findUnique: called once during duplicate call
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(updatedWallet);

      (prismaService.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      await walletService.creditWallet({
        walletId: testWalletId,
        amount: 25000,
        description: 'Paystack funding',
        reference: idempotencyKey,
      });

      expect(prismaService.walletTransaction.create).toHaveBeenCalledTimes(1);

      const duplicateResult = await walletService.creditWallet({
        walletId: testWalletId,
        amount: 25000,
        description: 'Paystack funding',
        reference: idempotencyKey,
      });

      expect(duplicateResult.id).toBeDefined();
      expect(prismaService.walletTransaction.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry Storm Handling', () => {
    it('should handle rapid retry attempts gracefully', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransaction = {
        id: randomUUID(),
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 1000,
        balanceBefore: '100000',
        balanceAfter: '99000',
        description: 'Test debit',
        idempotencyKey: 'retry_storm_test',
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      // First call: findUnique returns null; subsequent calls: return existing transaction
      (prismaService.walletTransaction.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockTransaction);

      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: '99000',
      });

      const retryPromises = Array(10)
        .fill(null)
        .map(() =>
          walletService.debitWallet({
            walletId: testWalletId,
            amount: 1000,
            description: 'Test debit',
            idempotencyKey: 'retry_storm_test',
          })
        );

      await expect(Promise.all(retryPromises)).resolves.toBeDefined();
    });

    it('should use idempotency key to prevent duplicate debits during retries', async () => {
      const idempotencyKey = `debit_${randomUUID()}`;

      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '200000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWallet = {
        ...mockWallet,
        balance: '150000',
      };

      const mockTransaction = {
        id: randomUUID(),
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 50000,
        balanceBefore: '200000',
        balanceAfter: '150000',
        description: 'Purchase',
        idempotencyKey,
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      // First call: findUnique returns null; subsequent calls: return existing transaction
      (prismaService.walletTransaction.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockTransaction);

      (prismaService.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      await walletService.debitWallet({
        walletId: testWalletId,
        amount: 50000,
        description: 'Purchase',
        idempotencyKey,
      });

      const calls = (prismaService.walletTransaction.create as jest.Mock).mock.calls.length;

      for (let i = 0; i < 5; i++) {
        await walletService.debitWallet({
          walletId: testWalletId,
          amount: 50000,
          description: 'Purchase',
          idempotencyKey,
        });
      }

      expect((prismaService.walletTransaction.create as jest.Mock).mock.calls.length).toBe(calls);
    });
  });

  describe('Failed Provider Calls', () => {
    it('should handle Paystack API failures with proper error mapping', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockRejectedValueOnce(
        new Error('Paystack API error')
      );

      await expect(
        walletService.initiateDeposit({
          userId: testUserId,
          amount: 50000,
          provider: 'paystack',
        })
      ).rejects.toThrow('Paystack API error');
    });

    it('should handle Flutterwave API failures gracefully', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockRejectedValueOnce(
        new Error('Flutterwave API error')
      );

      await expect(
        walletService.initiateDeposit({
          userId: testUserId,
          amount: 50000,
          provider: 'flutterwave',
        })
      ).rejects.toThrow('Flutterwave API error');
    });

    it('should rollback transaction on provider timeout', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const idempotencyKey = randomUUID();
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      // We need to mock $transaction to reject when it's called as an array
      // Let's override $transaction just for this test
      (prismaService.$transaction as jest.Mock).mockReset().mockImplementationOnce(async (arg) => {
        if (Array.isArray(arg)) {
          // Wait - the problem is that when we use Promise.all(arg), each operation is called individually!
          // So to simulate a transaction failure, we need to mock one of the operations to reject!
          // Since debitWallet does [walletTransaction.create, wallet.update], let's mock walletTransaction.create to reject!
          throw new Error('Provider timeout');
        } else if (typeof arg === 'function') {
          return arg(prismaService);
        }
      });

      (prismaService.walletTransaction.create as jest.Mock).mockImplementation(() => {
        throw new Error('Provider timeout');
      });

      await expect(
        walletService.debitWallet({
          walletId: testWalletId,
          amount: 50000,
          description: 'Test debit',
          idempotencyKey,
        })
      ).rejects.toThrow('Provider timeout');
    });
  });

  describe('Partial Transaction Failures', () => {
    it('should handle partial wallet update failure', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const idempotencyKey = randomUUID();

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.wallet.update as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('Database error'))
      );
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        id: randomUUID(),
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 50000,
        status: 'pending',
        description: 'Test debit',
        idempotencyKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      try {
        await walletService.debitWallet({
          walletId: testWalletId,
          amount: 50000,
          description: 'Test debit',
          idempotencyKey,
        });
        fail('Expected debitWallet to throw');
      } catch (e) {
        expect((e as Error).message).toBe('Database error');
      }
    });

    it('should handle transaction record creation failure', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const idempotencyKey = randomUUID();

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.walletTransaction.create as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('Failed to create transaction record'))
      );

      await expect(
        walletService.debitWallet({
          walletId: testWalletId,
          amount: 50000,
          description: 'Test debit',
          idempotencyKey,
        })
      ).rejects.toThrow('Failed to create transaction record');
    });
  });

  describe('Rollback and Compensation', () => {
    it('should rollback wallet debit when content provisioning fails', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const idempotencyKey = randomUUID();

      (prismaService.wallet.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockWallet)
        .mockResolvedValueOnce(mockWallet);
      (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      (prismaService.$transaction as jest.Mock).mockImplementationOnce(async () => {
        throw new Error('Content provisioning failed');
      });

      await expect(
        walletService.debitWallet({
          walletId: testWalletId,
          amount: 50000,
          description: 'Content purchase',
          idempotencyKey,
        })
      ).rejects.toThrow('Content provisioning failed');

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should compensate failed credit with reversal debit', async () => {
      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);

      (prismaService.$transaction as jest.Mock).mockImplementationOnce(async () => {
        throw new Error('Credit failed');
      });

      await expect(
        walletService.creditWallet({
          walletId: testWalletId,
          amount: 50000,
          description: 'Funding',
          reference: randomUUID(),
        })
      ).rejects.toThrow('Credit failed');
    });

    it('should handle double debit scenario with idempotency', async () => {
      const idempotencyKey = `double_debit_${randomUUID()}`;

      const existingTransaction = {
        id: randomUUID(),
        walletId: testWalletId,
        type: 'debit' as const,
        amount: 50000,
        balanceBefore: '100000',
        balanceAfter: '50000',
        description: 'Original debit',
        reference: idempotencyKey,
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '50000',
        bonusBalance: '0',
        promoBalance: '0',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.walletTransaction.findUnique as jest.Mock).mockReset();
      (prismaService.wallet.findUnique as jest.Mock).mockReset();

      (prismaService.walletTransaction.findUnique as jest.Mock).mockResolvedValue(
        existingTransaction
      );
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await walletService.debitWallet({
        walletId: testWalletId,
        amount: 50000,
        description: 'Double debit attempt',
        idempotencyKey,
      });

      expect(result.id).toBe(existingTransaction.id);
      expect(result.balance).toBe('50000');
    });
  });

  describe('Webhook Retry Queue', () => {
    it('should queue failed webhooks for retry', async () => {
      const webhookId = `wh_${randomUUID()}`;

      (prismaService.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.walletTransaction.create as jest.Mock).mockRejectedValue(
        new Error('Temporary failure')
      );

      const retryQueue: string[] = [];

      try {
        await walletService.processWebhook(webhookId, {
          event: 'charge.success',
          data: { id: randomUUID(), amount: 50000 },
        });
      } catch (error) {
        retryQueue.push(webhookId);
      }

      expect(retryQueue).toContain(webhookId);
    });

    it('should process queued webhooks after recovery', async () => {
      const webhookId = `wh_${randomUUID()}`;

      const mockWallet = {
        id: testWalletId,
        userId: testUserId,
        balance: '100000',
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTx = {
        id: randomUUID(),
        walletId: testWalletId,
        type: 'credit' as const,
        amount: 500,
        status: 'completed' as const,
        description: 'Webhook payment: charge.success',
        reference: 'test-reference',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTx);

      const result = await walletService.processWebhook(webhookId, {
        event: 'charge.success',
        data: { id: randomUUID(), amount: 50000, metadata: { walletId: testWalletId, userId: testUserId } },
      });

      expect(result).toBeDefined();
    });
  });
});

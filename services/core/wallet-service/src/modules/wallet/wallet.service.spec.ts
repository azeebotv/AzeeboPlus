import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService, RedisService } from '@azeebo/shared-services';
import { FeatureFlagService, walletFlags } from '@azeebo/feature-flags';
import { EVENT_BUS_SERVICE } from '@azeebo/event-bus';

jest.mock('../database/prisma.service');

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockWallet = {
    id: 'wallet-123',
    userId: 'user-123',
    balance: 1000,
    currency: 'NGN',
    bonusBalance: 50,
    promoBalance: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'txn-123',
    walletId: 'wallet-123',
    type: 'credit' as const,
    amount: 100,
    status: 'completed' as const,
    description: 'Test transaction',
    reference: 'ref-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            walletTransaction: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
            walletLedger: {
              create: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
            },
            $transaction: jest.fn(),
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
            getOrThrow: jest.fn((_key: string) => undefined),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
            deleteByPattern: jest.fn().mockResolvedValue(0),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setIfNotExists: jest.fn().mockResolvedValue(true),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: {
            // Default: all wallet flags OFF so existing tests run the plain
            // paths; individual tests re-enable what they exercise.
            isEnabled: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: EVENT_BUS_SERVICE,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.getBalance('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('balance', 1000);
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        bonusBalance: 150,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.redeemReward('user-123', 1000);

      expect(result.success).toBe(true);
    });
  });

  describe('creditBalance', () => {
    it('should credit balance successfully', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: 1100,
      });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.creditBalance('wallet-123', 100, 'Credit test');

      expect(result.success).toBe(true);
    });
  });

  describe('debitBalance', () => {
    it('should debit balance successfully', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 900 });
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
      });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(result.success).toBe(true);
    });
  });

  describe('race conditions', () => {
    it('should handle concurrent credit balance requests correctly', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: 1100,
      });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const result = await cb(prismaService);
        return result;
      });

      // Simulate 5 concurrent credit requests
      const promises = Array.from({ length: 5 }, () =>
        service.creditBalance('wallet-123', 100, 'Concurrent credit')
      );

      await Promise.all(promises);

      // Verify that transactions were called
      expect(prismaService.$transaction).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent debit balance requests correctly', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
      });
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 900 });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb(prismaService);
      });

      // Simulate 3 concurrent debit requests
      const promises = Array.from({ length: 3 }, () =>
        service.debitBalance('wallet-123', 100, 'Concurrent debit')
      );

      const results = await Promise.all(promises);

      expect(results.some((r) => r.success)).toBe(true);
    });

    it('should handle concurrent reward redemption requests correctly', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'bonus',
      });
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        bonusBalance: 150,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb(prismaService);
      });

      // Simulate 3 concurrent reward redemption requests
      const promises = Array.from({ length: 3 }, () => service.redeemReward('user-123', 1000));

      await Promise.all(promises);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('withdraw', () => {
    it('should withdraw funds successfully', async () => {
      const withdrawDto = { idempotencyKey: 'wd-test-key', amount: 500, bankAccountId: 'bank-account-123' };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
        amount: 500,
        description: 'Withdrawal to bank account',
      });
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 500 });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { ...mockWallet, balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.withdraw('user-123', withdrawDto);

      expect(result.success).toBe(true);
    });

    it('should fail with insufficient balance', async () => {
      const withdrawDto = { idempotencyKey: 'wd-test-key', amount: 5000, bankAccountId: 'bank-account-123' };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.withdraw('user-123', withdrawDto);
      expect(result.success).toBe(false);
    });

    it('should fail if wallet not found', async () => {
      const withdrawDto = { idempotencyKey: 'wd-test-key', amount: 500, bankAccountId: 'bank-account-123' };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.withdraw('user-123', withdrawDto);
      expect(result.success).toBe(false);
    });
  });

  describe('transfer', () => {
    it('should transfer funds to another user successfully', async () => {
      const transferDto = { idempotencyKey: 'trf-test-key', recipientId: 'user-456', amount: 200, note: 'Payment' };
      const recipientWallet = { ...mockWallet, id: 'wallet-456', userId: 'user-456' };

      (prismaService.wallet.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockWallet)
        .mockResolvedValueOnce(recipientWallet)
        .mockResolvedValueOnce({ ...mockWallet, balance: 800 });
      (prismaService.wallet.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockWallet, balance: 800 })
        .mockResolvedValueOnce({ ...recipientWallet, balance: 1200 });
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { ...mockWallet, balance: 1000 },
        { ...recipientWallet, balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.transfer('user-123', transferDto);

      expect(result.success).toBe(true);
    });

    it('should fail with insufficient balance', async () => {
      const transferDto = { idempotencyKey: 'trf-test-key', recipientId: 'user-456', amount: 5000, note: 'Payment' };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.transfer('user-123', transferDto);
      expect(result.success).toBe(false);
    });

    it('should fail if sender wallet not found', async () => {
      const transferDto = { idempotencyKey: 'trf-test-key', recipientId: 'user-456', amount: 200, note: 'Payment' };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.transfer('user-123', transferDto);
      expect(result.success).toBe(false);
    });

    it('should fail if recipient wallet not found', async () => {
      const transferDto = { idempotencyKey: 'trf-test-key', recipientId: 'user-456', amount: 200, note: 'Payment' };

      (prismaService.wallet.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockWallet)
        .mockResolvedValueOnce(null);

      const result = await service.transfer('user-123', transferDto);
      expect(result.success).toBe(false);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction details', async () => {
      const mockTxn = {
        id: 'txn-123',
        walletId: 'wallet-123',
        type: 'credit',
        amount: 100,
        status: 'completed',
        description: 'Test transaction',
        reference: 'ref-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
      };

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.walletTransaction.findFirst as jest.Mock).mockResolvedValue(mockTxn);

      const result = await service.getTransaction('user-123', 'txn-123');

      expect(result.success).toBe(true);
    });

    it('should fail if wallet not found', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getTransaction('user-123', 'txn-123')).rejects.toThrow();
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [
        { ...mockTransaction, id: 'txn-1' },
        { ...mockTransaction, id: 'txn-2' },
      ];

      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.$transaction as jest.Mock).mockResolvedValue([mockTransactions, 2]);

      const result = await service.getTransactions('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('transactions');
    });

    it('should return empty array if no transactions', async () => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.getTransactions('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).transactions).toEqual([]);
    });
  });

  describe('wallet_distributed_lock', () => {
    beforeEach(() => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 900 });
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
      });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));
    });

    it('acquires + releases the Redis lock around debit when the flag is on', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.distributedLock)
      );
      const redis = (
        service as unknown as { redisService: { setIfNotExists: jest.Mock; del: jest.Mock } }
      ).redisService;

      const result = await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(result.success).toBe(true);
      expect(redis.setIfNotExists).toHaveBeenCalledWith('wallet:lock:wallet-123', '1', 15);
      expect(redis.del).toHaveBeenCalledWith('wallet:lock:wallet-123');
    });

    it('skips the Redis lock when the flag is off', async () => {
      const redis = (service as unknown as { redisService: { setIfNotExists: jest.Mock } })
        .redisService;

      const result = await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(result.success).toBe(true);
      expect(redis.setIfNotExists).not.toHaveBeenCalled();
    });

    it('rejects a concurrent operation when the lock is held', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.distributedLock)
      );
      const redis = (service as unknown as { redisService: { setIfNotExists: jest.Mock } })
        .redisService;
      redis.setIfNotExists.mockResolvedValueOnce(false);

      await expect(service.debitBalance('wallet-123', 100, 'Debit test')).rejects.toThrow(
        'Another operation is already processing this wallet'
      );
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('fails open when Redis is unavailable', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.distributedLock)
      );
      const redis = (service as unknown as { redisService: { setIfNotExists: jest.Mock } })
        .redisService;
      redis.setIfNotExists.mockRejectedValueOnce(new Error('redis down'));

      const result = await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(result.success).toBe(true);
    });
  });

  describe('wallet_ledger_v2', () => {
    beforeEach(() => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 900 });
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
      });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));
    });

    it('writes a ledger entry on debit when the flag is on', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.ledgerV2)
      );

      const result = await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(result.success).toBe(true);
      expect(prismaService.walletLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walletId: 'wallet-123',
            operationType: 'debit',
            amount: 100,
            balanceAfter: '1000',
          }),
        })
      );
    });

    it('skips the ledger write when the flag is off', async () => {
      await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(prismaService.walletLedger.create).not.toHaveBeenCalled();
    });

    it('never fails the money movement when the ledger write errors', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.ledgerV2)
      );
      (prismaService.walletLedger.create as jest.Mock).mockRejectedValueOnce(
        new Error('ledger down')
      );

      const result = await service.debitBalance('wallet-123', 100, 'Debit test');

      expect(result.success).toBe(true);
    });
  });

  describe('wallet_fraud_checks', () => {
    beforeEach(() => {
      (prismaService.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prismaService.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 900 });
      (prismaService.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
      });
      (prismaService.walletTransaction.count as jest.Mock).mockResolvedValue(0);
      (prismaService.walletTransaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 0 },
      });
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { id: 'wallet-123', balance: 1000 },
      ]);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));
    });

    it('blocks a withdrawal when the hourly velocity limit is exceeded', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.fraudChecks)
      );
      (prismaService.walletTransaction.count as jest.Mock).mockResolvedValueOnce(3);

      await expect(
        service.withdraw('user-123', {
          idempotencyKey: 'wd-fraud-key',
          amount: 100,
          bankAccountId: 'bank-1',
        })
      ).rejects.toThrow('Transaction frequency limit exceeded');
    });

    it('blocks a withdrawal when the daily amount cap is exceeded', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.fraudChecks)
      );
      (prismaService.walletTransaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 999999 },
      });

      await expect(
        service.withdraw('user-123', {
          idempotencyKey: 'wd-fraud-key',
          amount: 1000,
          bankAccountId: 'bank-1',
        })
      ).rejects.toThrow('Daily transaction amount limit exceeded');
    });

    it('allows the withdrawal when limits are respected', async () => {
      const flagService = (
        service as unknown as {
          featureFlagService: { isEnabled: jest.Mock };
        }
      ).featureFlagService;
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === walletFlags.fraudChecks)
      );

      const result = await service.withdraw('user-123', {
        idempotencyKey: 'wd-fraud-key',
        amount: 100,
        bankAccountId: 'bank-1',
      });

      expect(result.success).toBe(true);
    });
  });
});

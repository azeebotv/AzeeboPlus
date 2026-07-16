import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { CacheService } from '@azeebo/shared-services';

jest.mock('../database/prisma.service');

describe('WalletService E2E Tests', () => {
  let service: WalletService;
  let prisma: jest.Mocked<PrismaService>;

  const mockWallet = {
    id: 'wallet-123',
    userId: 'user-123',
    balance: new Prisma.Decimal(1000),
    bonusBalance: new Prisma.Decimal(200),
    promoBalance: new Prisma.Decimal(100),
    currency: 'NGN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'txn-123',
    walletId: 'wallet-123',
    type: 'credit',
    amount: new Prisma.Decimal(500),
    status: 'completed',
    description: 'Test transaction',
    reference: 'ref-123',
    provider: 'paystack',
    providerRef: 'paystack-txn-1',
    metadata: null,
    idempotencyKey: 'idempotency-key-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const walletFindUniqueMock = jest.fn();
    const walletUpdateMock = jest.fn();
    const txCreateMock = jest
      .fn()
      .mockImplementation((data) => Promise.resolve({ ...mockTransaction, ...data }));
    const txFindUniqueMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              findUnique: walletFindUniqueMock,
              findMany: jest.fn(),
              create: jest.fn(),
              update: walletUpdateMock,
              upsert: jest.fn(),
            },
            walletTransaction: {
              create: txCreateMock,
              findMany: jest.fn(),
              findUnique: txFindUniqueMock,
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            $transaction: jest.fn(async (callbackOrArray: any) => {
              if (Array.isArray(callbackOrArray)) {
                const results = [];
                let updatedBalance = mockWallet.balance;
                for (const op of callbackOrArray) {
                  if (op.walletTransaction?.create) {
                    results.push({ ...mockTransaction, ...op.walletTransaction.create.data });
                  } else if (op.wallet?.update) {
                    if (op.wallet.update.data.balance?.increment) {
                      updatedBalance = new Prisma.Decimal(updatedBalance).add(
                        op.wallet.update.data.balance.increment
                      );
                    }
                    const updatedWallet = { ...mockWallet, balance: updatedBalance };
                    results.push(updatedWallet);
                    walletFindUniqueMock.mockResolvedValue(updatedWallet);
                  }
                }
                return results;
              }

              const tx = {
                wallet: {
                  findUnique: walletFindUniqueMock,
                  update: jest.fn((args) => {
                    let updatedWallet = { ...mockWallet };
                    if (args.data.balance?.increment) {
                      updatedWallet.balance = new Prisma.Decimal(mockWallet.balance).add(
                        args.data.balance.increment
                      );
                    }
                    if (args.data.balance?.decrement) {
                      updatedWallet.balance = new Prisma.Decimal(mockWallet.balance).sub(
                        args.data.balance.decrement
                      );
                    }
                    if (args.data.bonusBalance?.increment) {
                      updatedWallet.bonusBalance = new Prisma.Decimal(mockWallet.bonusBalance).add(
                        args.data.bonusBalance.increment
                      );
                    }
                    walletFindUniqueMock.mockResolvedValue(updatedWallet);
                    return updatedWallet;
                  }),
                },
                walletTransaction: {
                  create: txCreateMock,
                  findUnique: txFindUniqueMock,
                },
                $queryRaw: prisma.$queryRaw,
              };

              const result = await callbackOrArray(tx);
              return result;
            }),
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: number) => {
              if (key === 'POINTS_TO_NAIRA_RATE') {
                return defaultValue ?? 100;
              }
              return defaultValue;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'WEBHOOK_SECRET') return 'test-webhook-secret';
              return undefined;
            }),
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
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get(PrismaService);
  });

  beforeEach(() => {
    (prisma.$queryRaw as jest.Mock).mockReset();
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ ...mockWallet }]);
  });

  describe('Idempotency Tests', () => {
    it('should return same result for duplicate idempotent credit request', async () => {
      const idempotencyKey = 'unique-idempotency-key';
      const existingTransaction = {
        ...mockTransaction,
        idempotencyKey,
      };

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(existingTransaction);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.creditBalance('wallet-123', 500, 'Test credit', idempotencyKey);

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).balance).toBe(1000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).bonusBalance).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).promoBalance).toBe(100);
      expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('should return same result for duplicate idempotent debit request', async () => {
      const idempotencyKey = 'unique-idempotency-key-2';
      const existingTransaction = {
        ...mockTransaction,
        idempotencyKey,
        type: 'debit',
        amount: new Prisma.Decimal(200),
      };

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(existingTransaction);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: new Prisma.Decimal(800),
      });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ ...mockWallet, balance: new Prisma.Decimal(800) }]);

      const result = await service.debitBalance(
        'wallet-123',
        200,
        'Test debit',
        'ref-124',
        idempotencyKey
      );

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).balance).toBe(800);
      expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('should create new transaction for first-time idempotent request', async () => {
      const idempotencyKey = 'new-idempotency-key';

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: new Prisma.Decimal(1500),
      });

      const result = await service.creditBalance('wallet-123', 500, 'Test credit', idempotencyKey);

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).balance).toBe(1500);
      expect(prisma.walletTransaction.create).toHaveBeenCalled();
    });
  });

  describe('Rollback and Compensation Tests', () => {
    it('should rollback wallet update if transaction creation fails', async () => {
      const idempotencyKey = 'rollback-test-key';

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      const result = await service.creditBalance('wallet-123', 500, 'Test credit', idempotencyKey);

      expect(result.success).toBe(false);
    });

    it('should not update balance if transaction fails during debit', async () => {
      const idempotencyKey = 'debit-rollback-key';

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockRejectedValueOnce(
        new Error('Transaction failed')
      );

      const result = await service.debitBalance('wallet-123', 300, 'Test debit', 'ref-127', idempotencyKey);

      expect(result.success).toBe(false);
    });
  });

  describe('Balance Consistency Tests', () => {
    it('should return correct real-time balances after credit', async () => {
      const idempotencyKey = 'balance-test-key';

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: new Prisma.Decimal(1500),
      });

      const result = await service.creditBalance('wallet-123', 500, 'Test credit', idempotencyKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).balance).toBe(1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).bonusBalance).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).promoBalance).toBe(100);
    });

    it('should return correct real-time balances after debit', async () => {
      const idempotencyKey = 'debit-balance-key';

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        type: 'debit',
      });
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: new Prisma.Decimal(800),
      });

      const result = await service.debitBalance(
        'wallet-123',
        200,
        'Test debit',
        'ref-129',
        idempotencyKey
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).balance).toBe(800);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).bonusBalance).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).promoBalance).toBe(100);
    });

    it('should prevent negative balance on debit', async () => {
      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: new Prisma.Decimal(100),
      });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ ...mockWallet, balance: new Prisma.Decimal(100) }]);

      await expect(
        service.debitBalance('wallet-123', 200, 'Test debit', 'ref-130')
      ).rejects.toThrow();
    });
  });

  describe('Provider Reference Deduplication', () => {
    it('should prevent duplicate transactions with same provider reference', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.creditBalance('wallet-123', 500, 'Test', 'key-1');
      expect(result.success).toBe(true);
    });

    it('should allow transactions when no existing provider reference found', async () => {
      const idempotencyKey = 'provider-ref-key';

      (prisma.walletTransaction.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        providerRef: 'new-provider-ref',
      });
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        balance: new Prisma.Decimal(1500),
      });

      const result = await service.creditBalance('wallet-123', 500, 'Test', idempotencyKey);

      expect(result.success).toBe(true);
    });
  });
});

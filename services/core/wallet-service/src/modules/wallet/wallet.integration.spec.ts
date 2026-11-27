import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import { CacheService, RedisService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { EVENT_BUS_SERVICE } from '@azeebo/event-bus';

jest.mock('../database/prisma.service');

interface Wallet {
  id: string;
  userId: string;
  balance: Prisma.Decimal;
  bonusBalance: Prisma.Decimal;
  promoBalance: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: Prisma.Decimal;
  status: string;
  description: string;
  reference: string | null;
  metadata: unknown;
  idempotencyKey: string | null;
  provider: string | null;
  providerRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

describe('WalletService Integration', () => {
  let service: WalletService;
  let prisma: PrismaService;

  const mockWallet: Wallet = {
    id: 'wallet-123',
    userId: 'user-123',
    balance: new Prisma.Decimal(500),
    bonusBalance: new Prisma.Decimal(100),
    promoBalance: new Prisma.Decimal(50),
    currency: 'NGN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: WalletTransaction = {
    id: 'transaction-123',
    walletId: 'wallet-123',
    type: 'bonus',
    amount: new Prisma.Decimal(100),
    status: 'completed',
    description: 'Bonus credit: Referral bonus',
    reference: null,
    metadata: null,
    idempotencyKey: null,
    provider: null,
    providerRef: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    process.env.POINTS_TO_NAIRA_RATE = '100';
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            walletTransaction: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $queryRaw: jest.fn().mockResolvedValue([{ id: 'wallet-123', balance: 500 }]),
            $transaction: jest.fn((callback) => {
              const mockTx = {
                walletTransaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                wallet: {
                  update: jest
                    .fn()
                    .mockResolvedValue({ ...mockWallet, bonusBalance: new Prisma.Decimal(200) }),
                },
                $queryRaw: jest.fn().mockResolvedValue([{ id: 'wallet-123', balance: 500 }]),
              };
              return callback(mockTx);
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
            isEnabled: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: EVENT_BUS_SERVICE,
          useValue: {
            emit: jest.fn(),
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addBonusCredit', () => {
    it('should add bonus credit to wallet', async () => {
      const walletId = 'wallet-123';
      const amount = 100;
      const reason = 'Referral bonus';

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        bonusBalance: new Prisma.Decimal(200),
      });

      const result = await service.addBonusCredit(walletId, amount, reason);

      expect(result.success).toBe(true);
      const bonusData = result.data as { amount?: number; reason?: string };
      expect(bonusData?.amount).toBe(amount);
      expect(bonusData?.reason).toBe(reason);
    });
  });

  describe('addPromoCredit', () => {
    it('should add promo credit to wallet', async () => {
      const walletId = 'wallet-123';
      const amount = 50;
      const promoCode = 'SUMMER2024';
      const expiresAt = new Date('2024-12-31');

      const promoTransaction: WalletTransaction = {
        ...mockTransaction,
        id: 'transaction-456',
        type: 'promo',
        amount: new Prisma.Decimal(amount),
        description: `Promo credit: ${promoCode}`,
        metadata: { promoCode, expiresAt: expiresAt.toISOString() },
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue(promoTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        promoBalance: new Prisma.Decimal(100),
      });

      const result = await service.addPromoCredit(walletId, amount, promoCode, expiresAt);

      expect(result.success).toBe(true);
      const data = result.data as { amount?: number; promoCode?: string };
      expect(data?.amount).toBe(amount);
      expect(data?.promoCode).toBe(promoCode);
    });
  });

  describe('getTransactionAuditTrail', () => {
    it('should return transaction audit trail', async () => {
      const walletId = 'wallet-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const transactions: WalletTransaction[] = [
        {
          id: 'transaction-123',
          walletId,
          type: 'credit',
          amount: new Prisma.Decimal(1000),
          status: 'completed',
          description: 'Wallet funding',
          reference: null,
          metadata: null,
          idempotencyKey: null,
          provider: null,
          providerRef: null,
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ];

      (prisma.walletTransaction.findMany as jest.Mock).mockResolvedValue(transactions);

      const result = await service.getTransactionAuditTrail(walletId, startDate, endDate);

      expect(result.success).toBe(true);
      const auditData = result.data as { totalTransactions?: number };
      expect(auditData?.totalTransactions).toBe(1);
    });
  });

  describe('redeemReward', () => {
    it('should throw BadRequestException if points are invalid', async () => {
      const userId = 'user-123';
      const points = 0;

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      await expect(service.redeemReward(userId, points)).rejects.toThrow(BadRequestException);
    });
  });
});

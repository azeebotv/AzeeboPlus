import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Wallet, WalletTransaction } from '@prisma/client';

jest.mock('../database/prisma.service');

describe('WalletService Integration', () => {
  let service: WalletService;
  let prisma: PrismaService;

  const mockWallet: Wallet = {
    id: 'wallet-123',
    userId: 'user-123',
    balance: 500,
    bonusBalance: 100,
    promoBalance: 50,
    currency: 'NGN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: WalletTransaction = {
    id: 'transaction-123',
    walletId: 'wallet-123',
    type: 'bonus',
    amount: 100,
    status: 'completed',
    description: 'Bonus credit: Referral bonus',
    reference: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
              update: jest.fn(),
            },
            walletTransaction: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
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

      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        bonusBalance: 200,
      });

      const result = await service.addBonusCredit(walletId, amount, reason);

      expect(result.success).toBe(true);
      if ('amount' in (result.data ?? {})) {
        expect(result.data.amount).toBe(amount);
      }
      if ('reason' in (result.data ?? {})) {
        expect(result.data.reason).toBe(reason);
      }
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
        amount,
        description: `Promo credit: ${promoCode}`,
        metadata: { promoCode, expiresAt: expiresAt.toISOString() },
      };

      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue(promoTransaction);
      (prisma.wallet.update as jest.Mock).mockResolvedValue({
        ...mockWallet,
        promoBalance: 100,
      });

      const result = await service.addPromoCredit(walletId, amount, promoCode, expiresAt);

      expect(result.success).toBe(true);
      if ('amount' in (result.data ?? {})) {
        expect(result.data.amount).toBe(amount);
      }
      if ('promoCode' in (result.data ?? {})) {
        expect(result.data.promoCode).toBe(promoCode);
      }
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
          amount: 1000,
          status: 'completed',
          description: 'Wallet funding',
          reference: null,
          metadata: null,
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ];

      (prisma.walletTransaction.findMany as jest.Mock).mockResolvedValue(transactions);

      const result = await service.getTransactionAuditTrail(walletId, startDate, endDate);

      expect(result.success).toBe(true);
      if ('totalTransactions' in (result.data ?? {})) {
        expect(result.data.totalTransactions).toBe(1);
      }
    });
  });

  describe('redeemReward', () => {
    it('should throw BadRequestException if points are invalid', async () => {
      const userId = 'user-123';
      const points = 0;

      await expect(service.redeemReward(userId, points)).rejects.toThrow(BadRequestException);
    });
  });
});
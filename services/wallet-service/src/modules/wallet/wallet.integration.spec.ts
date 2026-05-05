import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WalletService Integration', () => {
  let service: WalletService;
  let prisma: PrismaService;

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

      jest.spyOn(prisma.wallet, 'findUnique').mockResolvedValue({
        id: walletId,
        userId: 'user-123',
        balance: 500,
        bonusBalance: 100,
        promoBalance: 50,
        currency: 'NGN',
      });

      jest.spyOn(prisma.walletTransaction, 'create').mockResolvedValue({
        id: 'transaction-123',
        walletId,
        type: 'bonus',
        amount,
        status: 'completed',
        description: `Bonus credit: ${reason}`,
        createdAt: new Date(),
      });

      jest.spyOn(prisma.wallet, 'update').mockResolvedValue({
        id: walletId,
        userId: 'user-123',
        balance: 500,
        bonusBalance: 200,
        promoBalance: 50,
        currency: 'NGN',
      });

      const result = await service.addBonusCredit(walletId, amount, reason);

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(amount);
      expect(result.data.reason).toBe(reason);
    });
  });

  describe('addPromoCredit', () => {
    it('should add promo credit to wallet', async () => {
      const walletId = 'wallet-123';
      const amount = 50;
      const promoCode = 'SUMMER2024';
      const expiresAt = new Date('2024-12-31');

      jest.spyOn(prisma.wallet, 'findUnique').mockResolvedValue({
        id: walletId,
        userId: 'user-123',
        balance: 500,
        bonusBalance: 100,
        promoBalance: 50,
        currency: 'NGN',
      });

      jest.spyOn(prisma.walletTransaction, 'create').mockResolvedValue({
        id: 'transaction-456',
        walletId,
        type: 'promo',
        amount,
        status: 'completed',
        description: `Promo credit: ${promoCode}`,
        metadata: { promoCode, expiresAt: expiresAt.toISOString() },
        createdAt: new Date(),
      });

      jest.spyOn(prisma.wallet, 'update').mockResolvedValue({
        id: walletId,
        userId: 'user-123',
        balance: 500,
        bonusBalance: 100,
        promoBalance: 100,
        currency: 'NGN',
      });

      const result = await service.addPromoCredit(walletId, amount, promoCode, expiresAt);

      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(amount);
      expect(result.data.promoCode).toBe(promoCode);
    });
  });

  describe('getTransactionAuditTrail', () => {
    it('should return transaction audit trail', async () => {
      const walletId = 'wallet-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      jest.spyOn(prisma.walletTransaction, 'findMany').mockResolvedValue([
        {
          id: 'transaction-123',
          walletId,
          type: 'credit',
          amount: 1000,
          status: 'completed',
          description: 'Wallet funding',
          createdAt: new Date('2024-06-01'),
        },
      ]);

      const result = await service.getTransactionAuditTrail(walletId, startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data.totalTransactions).toBe(1);
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

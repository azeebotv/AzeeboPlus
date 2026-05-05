import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  wallet: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  walletTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
  $queryRaw: jest.fn(),
};

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return correct balance breakdown', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 1000,
        bonusBalance: 200,
        promoBalance: 100,
        currency: 'NGN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getBalance('user-1');

      expect(result).toEqual({
        success: true,
        data: {
          balance: 1000,
          bonusBalance: 200,
          promoBalance: 100,
          totalBalance: 1300,
          currency: 'NGN',
        },
      });
      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should throw NotFoundException for unknown userId', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('unknown-user')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('debitBalance', () => {
    it('should deduct amount atomically', async () => {
      const mockWallet = [
        {
          id: 'wallet-1',
          userId: 'user-1',
          balance: 1000,
          bonusBalance: 200,
          promoBalance: 100,
        },
      ];
      const mockTransaction = {
        id: 'tx-1',
        walletId: 'wallet-1',
        type: 'debit',
        amount: 500,
        status: 'completed',
        description: 'Test debit',
        reference: 'ref-1',
      };

      mockPrisma.$queryRaw.mockResolvedValue(mockWallet);
      mockPrisma.wallet.update.mockResolvedValue({});
      mockPrisma.walletTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.debitBalance('wallet-1', 500, 'Test debit', 'ref-1');

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { decrement: 500 } },
      });
      expect(mockPrisma.walletTransaction.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const mockWallet = [
        {
          id: 'wallet-1',
          userId: 'user-1',
          balance: 100,
          bonusBalance: 0,
          promoBalance: 0,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockWallet);

      await expect(
        service.debitBalance('wallet-1', 500, 'Test debit')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown walletId', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(
        service.debitBalance('unknown-wallet', 100, 'Test debit')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('creditBalance', () => {
    it('should increment balance correctly', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 500,
      };
      const mockTransaction = {
        id: 'tx-1',
        walletId: 'wallet-1',
        type: 'credit',
        amount: 300,
        status: 'completed',
        description: 'Test credit',
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.wallet.update.mockResolvedValue({});
      mockPrisma.walletTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.creditBalance('wallet-1', 300, 'Test credit');

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { balance: { increment: 300 } },
      });
    });
  });

  describe('redeemReward', () => {
    it('should convert points to bonus balance at correct rate', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 1000,
        bonusBalance: 0,
        promoBalance: 0,
        currency: 'NGN',
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.walletTransaction.create.mockResolvedValue({});
      mockPrisma.wallet.update.mockResolvedValue({
        ...mockWallet,
        bonusBalance: 50,
      });

      const result = await service.redeemReward('user-1', 5000);

      expect(result).toEqual({
        success: true,
        data: {
          message: 'Reward redeemed successfully',
          pointsRedeemed: 5000,
          amountAdded: 50,
          newBonusBalance: 50,
        },
      });
    });

    it('should throw BadRequestException for points <= 0', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 1000,
        bonusBalance: 0,
        promoBalance: 0,
      };

      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.redeemReward('user-1', 0)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});

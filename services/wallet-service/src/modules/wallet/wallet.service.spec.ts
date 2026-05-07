import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';

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
            },
            ledgerEntry: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
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

  describe('getWallet', () => {
    it('should return wallet with balance', async () => {
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWallet('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('balance', 1000);
      expect(result.data).toHaveProperty('bonusBalance', 50);
    });

    it('should create wallet if not exists', async () => {
      prismaService.wallet.findUnique.mockResolvedValue(null);
      prismaService.wallet.create.mockResolvedValue(mockWallet);

      const result = await service.getWallet('user-123');

      expect(result.success).toBe(true);
      expect(prismaService.wallet.create).toHaveBeenCalled();
    });
  });

  describe('fundWallet', () => {
    it('should fund wallet successfully', async () => {
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaService.wallet.update.mockResolvedValue({ ...mockWallet, balance: 1100 });
      prismaService.walletTransaction.create.mockResolvedValue(mockTransaction);
      prismaService.ledgerEntry.create.mockResolvedValue({ id: 'ledger-1' });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.fundWallet('user-123', 100, 'card');

      expect(result.success).toBe(true);
    });

    it('should fail with invalid amount', async () => {
      const result = await service.fundWallet('user-123', -100, 'card');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'INVALID_AMOUNT');
    });

    it('should fail when wallet not found', async () => {
      prismaService.wallet.findUnique.mockResolvedValue(null);

      const result = await service.fundWallet('user-123', 100, 'card');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'WALLET_NOT_FOUND');
    });
  });

  describe('withdraw', () => {
    it('should withdraw successfully when balance is sufficient', async () => {
      prismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaService.wallet.update.mockResolvedValue({ ...mockWallet, balance: 900 });
      prismaService.walletTransaction.create.mockResolvedValue(mockTransaction);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.withdraw('user-123', 100, 'bank');

      expect(result.success).toBe(true);
    });

    it('should fail when balance is insufficient', async () => {
      prismaService.wallet.findUnique.mockResolvedValue({ ...mockWallet, balance: 50 });

      const result = await service.withdraw('user-123', 100, 'bank');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'INSUFFICIENT_BALANCE');
    });
  });

  describe('transfer', () => {
    it('should transfer successfully', async () => {
      const senderWallet = { ...mockWallet, balance: 1000 };
      const recipientWallet = { ...mockWallet, id: 'wallet-456', balance: 500 };

      prismaService.wallet.findUnique
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet);
      prismaService.wallet.update.mockResolvedValue({ ...mockWallet, balance: 900 });
      prismaService.walletTransaction.create.mockResolvedValue(mockTransaction);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.transfer('user-123', 'user-456', 100);

      expect(result.success).toBe(true);
    });

    it('should fail when transferring to self', async () => {
      const result = await service.transfer('user-123', 'user-123', 100);

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'CANNOT_TRANSFER_TO_SELF');
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history', async () => {
      prismaService.walletTransaction.findMany.mockResolvedValue([mockTransaction]);

      const result = await service.getTransactions('user-123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('ledger integrity', () => {
    it('should maintain ledger balance consistency', async () => {
      const wallet = { ...mockWallet, balance: 1000 };
      prismaService.wallet.findUnique.mockResolvedValue(wallet);
      prismaService.walletTransaction.create.mockResolvedValue(mockTransaction);
      prismaService.ledgerEntry.create.mockResolvedValue({ id: 'ledger-1' });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      await service.fundWallet('user-123', 100, 'card');

      expect(prismaService.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walletId: 'wallet-123',
            type: 'credit',
            amount: 100,
          }),
        })
      );
    });
  });
});

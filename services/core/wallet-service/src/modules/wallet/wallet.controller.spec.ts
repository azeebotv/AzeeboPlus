import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@azeebo/security', () => ({
  AdminGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
  RateLimitGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
  RateLimit: () => () => {},
}));

jest.mock('../../cache/index.js', () => ({
  CacheInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn().mockImplementation(
      (_context: unknown, next: { handle: () => unknown }) => next.handle()
    ),
  })),
  Cache: () => () => {},
}));

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: jest.Mocked<WalletService>;

  const mockUserId = 'user-123';
  const mockWalletId = 'wallet-123';

  const mockTransaction = {
    id: 'txn-123',
    walletId: mockWalletId,
    type: 'credit',
    amount: 100,
    status: 'completed',
    description: 'Test transaction',
    reference: 'ref-123',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            getBalance: jest.fn(),
            getTransactions: jest.fn(),
            getSummary: jest.fn(),
            initializeFunding: jest.fn(),
            redeemReward: jest.fn(),
            addBonusCredit: jest.fn(),
            addPromoCredit: jest.fn(),
            getTransactionAuditTrail: jest.fn(),
            debitBalance: jest.fn(),
            creditBalance: jest.fn(),
            chargeWallet: jest.fn(),
            creditReverse: jest.fn(),
            withdraw: jest.fn(),
            transfer: jest.fn(),
            getTransaction: jest.fn(),
            getWalletIdByUserId: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: mockUserId, id: mockUserId, role: 'admin' }),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    walletService = module.get(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /wallet/charge', () => {
    it('should charge wallet atomically and return transaction ID', async () => {
      const chargeResult = { transactionId: 'txn-charge-1', balance: 900 };
      walletService.chargeWallet.mockResolvedValue(chargeResult);

      const body = {
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-charge-1',
        description: 'Vote entry fee',
        metadata: { universeId: 'reality' },
      };

      const result = await controller.chargeWallet(body);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(chargeResult);
      expect(walletService.chargeWallet).toHaveBeenCalledWith({
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-charge-1',
        description: 'Vote entry fee',
        metadata: { universeId: 'reality' },
      });
    });

    it('should throw NotFoundException when wallet not found', async () => {
      walletService.chargeWallet.mockRejectedValue(
        new NotFoundException(`Wallet not found for user ${mockUserId}`)
      );

      const body = {
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-charge-2',
        description: 'Vote entry fee',
      };

      await expect(controller.chargeWallet(body)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      walletService.chargeWallet.mockRejectedValue(new BadRequestException('Insufficient balance'));

      const body = {
        userId: mockUserId,
        amount: 5000,
        idempotencyKey: 'idem-charge-3',
        description: 'Expensive purchase',
      };

      await expect(controller.chargeWallet(body)).rejects.toThrow(BadRequestException);
    });

    it('should return existing transaction for duplicate idempotency key', async () => {
      const duplicateResult = { transactionId: 'txn-charge-1', balance: 1000 };
      walletService.chargeWallet.mockResolvedValue(duplicateResult);

      const body = {
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-charge-duplicate',
        description: 'Vote entry fee',
      };

      const result = await controller.chargeWallet(body);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(duplicateResult);
    });
  });

  describe('POST /wallet/credit-reverse', () => {
    it('should credit back failed operation and return transaction ID', async () => {
      const reverseResult = { transactionId: 'txn-reverse-1', balance: 1100 };
      walletService.creditReverse.mockResolvedValue(reverseResult);

      const body = {
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-reverse-1',
        description: 'Compensation for failed entity creation',
        metadata: { originalChargeKey: 'idem-charge-1' },
      };

      const result = await controller.creditReverse(body);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(reverseResult);
      expect(walletService.creditReverse).toHaveBeenCalledWith({
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-reverse-1',
        description: 'Compensation for failed entity creation',
        metadata: { originalChargeKey: 'idem-charge-1' },
      });
    });

    it('should throw NotFoundException when wallet not found', async () => {
      walletService.creditReverse.mockRejectedValue(
        new NotFoundException(`Wallet not found for user ${mockUserId}`)
      );

      const body = {
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-reverse-2',
        description: 'Compensation',
      };

      await expect(controller.creditReverse(body)).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate idempotency key by returning existing result', async () => {
      const existingResult = { transactionId: 'txn-reverse-existing', balance: 1000 };
      walletService.creditReverse.mockResolvedValue(existingResult);

      const body = {
        userId: mockUserId,
        amount: 100,
        idempotencyKey: 'idem-reverse-duplicate',
        description: 'Compensation',
      };

      const result = await controller.creditReverse(body);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingResult);
      expect(walletService.creditReverse).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /wallet/debit', () => {
    it('should debit wallet and return success', async () => {
      const debitResult = {
        walletId: mockWalletId,
        amount: 100,
        status: 'completed',
        description: 'Service charge',
        balance: 900,
        bonusBalance: 50,
        promoBalance: 25,
      };
      walletService.debitBalance.mockResolvedValue({ success: true, data: debitResult });

      const body = {
        walletId: mockWalletId,
        amount: 100,
        description: 'Service charge',
        idempotencyKey: 'idem-debit-1',
      };

      const result = await controller.debitWallet(body);

      expect(result.success).toBe(true);
      expect(walletService.debitBalance).toHaveBeenCalledWith(
        mockWalletId,
        100,
        'Service charge',
        undefined,
        'idem-debit-1'
      );
    });

    it('should throw NotFoundException when wallet not found', async () => {
      walletService.debitBalance.mockRejectedValue(new NotFoundException('Wallet not found'));

      const body = {
        walletId: 'nonexistent-wallet',
        amount: 100,
        description: 'Service charge',
      };

      await expect(controller.debitWallet(body)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      walletService.debitBalance.mockRejectedValue(
        new BadRequestException('Insufficient balance')
      );

      const body = {
        walletId: mockWalletId,
        amount: 9999,
        description: 'Large debit',
      };

      await expect(controller.debitWallet(body)).rejects.toThrow(BadRequestException);
    });

    it('should handle duplicate idempotency key', async () => {
      const existingResult = {
        walletId: mockWalletId,
        amount: 100,
        status: 'completed',
        reference: 'ref-existing',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: 900,
        bonusBalance: 50,
        promoBalance: 25,
      };
      walletService.debitBalance.mockResolvedValue({ success: true, data: existingResult });

      const body = {
        walletId: mockWalletId,
        amount: 100,
        description: 'Service charge',
        idempotencyKey: 'idem-debit-duplicate',
      };

      const result = await controller.debitWallet(body);

      expect(result.success).toBe(true);
    });
  });

  describe('POST /wallet/credit', () => {
    it('should credit wallet and return success', async () => {
      const creditResult = {
        walletId: mockWalletId,
        amount: 200,
        status: 'completed',
        description: 'Refund',
        balance: 1200,
        bonusBalance: 50,
        promoBalance: 25,
      };
      walletService.creditBalance.mockResolvedValue({ success: true, data: creditResult });

      const body = {
        walletId: mockWalletId,
        amount: 200,
        description: 'Refund',
        idempotencyKey: 'idem-credit-1',
      };

      const result = await controller.creditWallet(body);

      expect(result.success).toBe(true);
      expect(walletService.creditBalance).toHaveBeenCalledWith(
        mockWalletId,
        200,
        'Refund',
        'idem-credit-1'
      );
    });

    it('should throw NotFoundException when wallet not found', async () => {
      walletService.creditBalance.mockRejectedValue(new NotFoundException('Wallet not found'));

      const body = {
        walletId: 'nonexistent-wallet',
        amount: 200,
        description: 'Refund',
      };

      await expect(controller.creditWallet(body)).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate idempotency key', async () => {
      const existingResult = {
        walletId: mockWalletId,
        amount: 200,
        status: 'completed',
        reference: 'ref-existing-credit',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: 1000,
        bonusBalance: 50,
        promoBalance: 25,
      };
      walletService.creditBalance.mockResolvedValue({ success: true, data: existingResult });

      const body = {
        walletId: mockWalletId,
        amount: 200,
        description: 'Refund',
        idempotencyKey: 'idem-credit-duplicate',
      };

      const result = await controller.creditWallet(body);

      expect(result.success).toBe(true);
    });
  });

  describe('GET /wallet/balance', () => {
    it('should return wallet balance', async () => {
      const balanceResult = {
        success: true,
        data: {
          balance: 1000,
          bonusBalance: 50,
          promoBalance: 25,
          totalBalance: 1075,
          currency: 'NGN',
        },
      };
      walletService.getBalance.mockResolvedValue(balanceResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.getBalance(req);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('balance', 1000);
      expect(walletService.getBalance).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('POST /wallet/fund', () => {
    it('should initialize funding successfully', async () => {
      const fundResult = {
        success: true,
        data: {
          transactionId: 'txn-fund-1',
          amount: 500,
          status: 'pending',
          message: 'Payment initialization successful',
          balance: 1000,
          bonusBalance: 50,
          promoBalance: 25,
        },
      };
      walletService.initializeFunding.mockResolvedValue(fundResult as never);

      const req = { user: { id: mockUserId } };
      const fundDto = { amount: 500, reference: 'paystack-ref-1' };
      const result = await controller.fundWallet(req, fundDto);

      expect(result.success).toBe(true);
      expect(walletService.initializeFunding).toHaveBeenCalledWith(mockUserId, fundDto);
    });
  });

  describe('POST /wallet/redeem-reward', () => {
    it('should redeem reward points', async () => {
      const redeemResult = {
        success: true,
        data: {
          message: 'Reward redeemed successfully',
          pointsRedeemed: 1000,
          amountAdded: 10,
          balance: 1000,
          bonusBalance: 60,
          promoBalance: 25,
        },
      };
      walletService.redeemReward.mockResolvedValue(redeemResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.redeemReward(req, { points: 1000 });

      expect(result.success).toBe(true);
      expect(walletService.redeemReward).toHaveBeenCalledWith(mockUserId, 1000);
    });
  });

  describe('POST /wallet/withdraw', () => {
    it('should initiate withdrawal', async () => {
      const withdrawResult = {
        success: true,
        data: {
          transactionId: 'WD-123',
          amount: 500,
          status: 'processing',
          description: 'Withdrawal to bank account',
          balance: 500,
          bonusBalance: 50,
          promoBalance: 25,
        },
      };
      walletService.withdraw.mockResolvedValue(withdrawResult as never);

      const req = { user: { id: mockUserId } };
      const withdrawDto = { amount: 500, bankAccountId: 'bank-123' };
      const result = await controller.withdraw(req, withdrawDto);

      expect(result.success).toBe(true);
      expect(walletService.withdraw).toHaveBeenCalledWith(mockUserId, withdrawDto);
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      walletService.withdraw.mockRejectedValue(new BadRequestException('Insufficient balance'));

      const req = { user: { id: mockUserId } };
      const withdrawDto = { amount: 99999, bankAccountId: 'bank-123' };

      await expect(controller.withdraw(req, withdrawDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /wallet/transfer', () => {
    it('should transfer funds to another user', async () => {
      const transferResult = {
        success: true,
        data: {
          senderReference: 'TRF-OUT-123',
          recipientReference: 'TRF-IN-123',
          amount: 200,
          status: 'completed',
          description: 'Transfer to user',
          balance: 800,
          bonusBalance: 50,
          promoBalance: 25,
        },
      };
      walletService.transfer.mockResolvedValue(transferResult as never);

      const req = { user: { id: mockUserId } };
      const transferDto = { recipientId: 'user-456', amount: 200, note: 'Payment' };
      const result = await controller.transfer(req, transferDto);

      expect(result.success).toBe(true);
      expect(walletService.transfer).toHaveBeenCalledWith(mockUserId, transferDto);
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      walletService.transfer.mockRejectedValue(new BadRequestException('Insufficient balance'));

      const req = { user: { id: mockUserId } };
      const transferDto = { recipientId: 'user-456', amount: 99999, note: 'Payment' };

      await expect(controller.transfer(req, transferDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /wallet/transactions', () => {
    it('should return paginated transactions', async () => {
      const txResult = {
        success: true,
        data: {
          transactions: [mockTransaction],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false, nextCursor: null, prevCursor: null },
        },
      };
      walletService.getTransactions.mockResolvedValue(txResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.getTransactions(req, 1, 20);

      expect(result.success).toBe(true);
      expect(walletService.getTransactions).toHaveBeenCalledWith(mockUserId, 1, 20, undefined);
    });

    it('should clamp limit between 1 and 100', async () => {
      walletService.getTransactions.mockResolvedValue({
        success: true,
        data: { transactions: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false, nextCursor: null, prevCursor: null } },
      } as never);

      const req = { user: { id: mockUserId } };
      await controller.getTransactions(req, 1, 500);

      expect(walletService.getTransactions).toHaveBeenCalledWith(mockUserId, 1, 100, undefined);
    });
  });

  describe('GET /wallet/summary', () => {
    it('should return wallet summary', async () => {
      const summaryResult = {
        success: true,
        data: {
          balance: 1000,
          bonusBalance: 50,
          promoBalance: 25,
          totalBalance: 1075,
          currency: 'NGN',
          recentTransactions: [],
        },
      };
      walletService.getSummary.mockResolvedValue(summaryResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.getSummary(req);

      expect(result.success).toBe(true);
      expect(walletService.getSummary).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('GET /wallet/transactions/:id', () => {
    it('should return transaction details', async () => {
      const txnResult = {
        success: true,
        data: mockTransaction,
      };
      walletService.getTransaction.mockResolvedValue(txnResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.getTransaction(req, 'txn-123');

      expect(result.success).toBe(true);
      expect(walletService.getTransaction).toHaveBeenCalledWith(mockUserId, 'txn-123');
    });

    it('should throw NotFoundException for missing transaction', async () => {
      walletService.getTransaction.mockRejectedValue(
        new NotFoundException('Transaction not found')
      );

      const req = { user: { id: mockUserId } };

      await expect(controller.getTransaction(req, 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('GET /wallets/user/:userId (via getBalance)', () => {
    it('should return wallet balance for authenticated user', async () => {
      const balanceResult = {
        success: true,
        data: {
          balance: 500,
          bonusBalance: 10,
          promoBalance: 5,
          totalBalance: 515,
          currency: 'NGN',
        },
      };
      walletService.getBalance.mockResolvedValue(balanceResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.getBalance(req);

      expect(result.success).toBe(true);
      expect(walletService.getBalance).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      walletService.getBalance.mockRejectedValue(
        new NotFoundException(`Wallet not found for user ${mockUserId}`)
      );

      const req = { user: { id: mockUserId } };

      await expect(controller.getBalance(req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /wallet/bonus-credit', () => {
    it('should add bonus credit', async () => {
      walletService.getWalletIdByUserId.mockResolvedValue(mockWalletId);
      const bonusResult = {
        success: true,
        data: { amount: 500, reason: 'Referral bonus', balance: 1000, bonusBalance: 550, promoBalance: 25 },
      };
      walletService.addBonusCredit.mockResolvedValue(bonusResult as never);

      const req = { user: { id: mockUserId } };
      const body = { amount: 500, reason: 'Referral bonus' };
      const result = await controller.addBonusCredit(req, body);

      expect(result.success).toBe(true);
      expect(walletService.getWalletIdByUserId).toHaveBeenCalledWith(mockUserId);
      expect(walletService.addBonusCredit).toHaveBeenCalledWith(mockWalletId, 500, 'Referral bonus');
    });
  });

  describe('POST /wallet/promo-credit', () => {
    it('should add promo credit', async () => {
      walletService.getWalletIdByUserId.mockResolvedValue(mockWalletId);
      const promoResult = {
        success: true,
        data: { amount: 100, promoCode: 'SUMMER2024', expiresAt: new Date().toISOString(), balance: 1000, bonusBalance: 50, promoBalance: 125 },
      };
      walletService.addPromoCredit.mockResolvedValue(promoResult as never);

      const req = { user: { id: mockUserId } };
      const body = { amount: 100, promoCode: 'SUMMER2024', expiresAt: '2024-12-31' };
      const result = await controller.addPromoCredit(req, body);

      expect(result.success).toBe(true);
      expect(walletService.addPromoCredit).toHaveBeenCalledWith(
        mockWalletId,
        100,
        'SUMMER2024',
        expect.any(Date)
      );
    });
  });

  describe('GET /wallet/audit-trail', () => {
    it('should return audit trail', async () => {
      walletService.getWalletIdByUserId.mockResolvedValue(mockWalletId);
      const auditResult = {
        success: true,
        data: {
          walletId: mockWalletId,
          startDate: expect.any(String),
          endDate: expect.any(String),
          totalTransactions: 2,
          transactions: [mockTransaction],
        },
      };
      walletService.getTransactionAuditTrail.mockResolvedValue(auditResult as never);

      const req = { user: { id: mockUserId } };
      const result = await controller.getAuditTrail(req, '2024-01-01', '2024-12-31');

      expect(result.success).toBe(true);
      expect(walletService.getTransactionAuditTrail).toHaveBeenCalledWith(
        mockWalletId,
        expect.any(Date),
        expect.any(Date)
      );
    });
  });
});

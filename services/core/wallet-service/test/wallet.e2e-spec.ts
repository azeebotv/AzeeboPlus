import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { PrismaService } from '../src/modules/database/prisma.service';

const AuthGuardPass: CanActivate = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'usr_sender01', role: 'user', email: 'sender@example.com' };
    return true;
  },
};

describe('Wallet E2E', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockWalletService = {
    getBalance: jest.fn(),
    initializeFunding: jest.fn(),
    transfer: jest.fn(),
    getTransactions: jest.fn(),
    getSummary: jest.fn(),
    withdraw: jest.fn(),
    getTransaction: jest.fn(),
  };

  const mockPrismaService = {
    wallet: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WalletService)
      .useValue(mockWalletService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    // Override the global ServiceAuthGuard to bypass auth in tests
    app.useGlobalGuards(AuthGuardPass);
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /wallet ─────────────────────────────────────────────────────

  describe('GET /wallet', () => {
    it('should return wallet balance for authenticated user', async () => {
      mockWalletService.getBalance.mockResolvedValue({
        success: true,
        data: {
          balance: 5000,
          bonusBalance: 250,
          promoBalance: 100,
          totalBalance: 5350,
          currency: 'NGN',
        },
      });

      const res = await request(baseUrl).get('/wallet').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(5000);
      expect(res.body.data.bonusBalance).toBe(250);
      expect(res.body.data.promoBalance).toBe(100);
      expect(res.body.data.totalBalance).toBe(5350);
      expect(res.body.data.currency).toBe('NGN');
      expect(mockWalletService.getBalance).toHaveBeenCalledWith('usr_sender01');
    });

    it('should return 0 balance for new wallet', async () => {
      mockWalletService.getBalance.mockResolvedValue({
        success: true,
        data: {
          balance: 0,
          bonusBalance: 0,
          promoBalance: 0,
          totalBalance: 0,
          currency: 'NGN',
        },
      });

      const res = await request(baseUrl).get('/wallet').expect(200);

      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.totalBalance).toBe(0);
    });
  });

  // ─── POST /wallet/fund ───────────────────────────────────────────────

  describe('POST /wallet/fund', () => {
    it('should initialize funding successfully', async () => {
      const dto = { amount: 2500, reference: 'pay_ref_123' };

      mockWalletService.initializeFunding.mockResolvedValue({
        success: true,
        data: {
          transactionId: 'txn_fund_001',
          amount: 2500,
          status: 'pending',
          message: 'Payment initialization successful',
          balance: 5000,
          bonusBalance: 250,
          promoBalance: 100,
        },
      });

      const res = await request(baseUrl).post('/wallet/fund').send(dto).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.transactionId).toBe('txn_fund_001');
      expect(res.body.data.amount).toBe(2500);
      expect(res.body.data.status).toBe('pending');
      expect(mockWalletService.initializeFunding).toHaveBeenCalledWith('usr_sender01', dto);
    });

    it('should initialize funding without optional reference', async () => {
      const dto = { amount: 1000 };

      mockWalletService.initializeFunding.mockResolvedValue({
        success: true,
        data: {
          transactionId: 'txn_fund_002',
          amount: 1000,
          status: 'pending',
          message: 'Payment initialization successful',
          balance: 5000,
          bonusBalance: 250,
          promoBalance: 100,
        },
      });

      const res = await request(baseUrl).post('/wallet/fund').send(dto).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(1000);
    });

    it('should reject funding with zero amount', async () => {
      const dto = { amount: 0 };

      await request(baseUrl).post('/wallet/fund').send(dto).expect(400);

      expect(mockWalletService.initializeFunding).not.toHaveBeenCalled();
    });

    it('should reject funding with negative amount', async () => {
      const dto = { amount: -500 };

      await request(baseUrl).post('/wallet/fund').send(dto).expect(400);

      expect(mockWalletService.initializeFunding).not.toHaveBeenCalled();
    });

    it('should reject funding with missing amount', async () => {
      await request(baseUrl).post('/wallet/fund').send({}).expect(400);

      expect(mockWalletService.initializeFunding).not.toHaveBeenCalled();
    });

    it('should reject funding with non-numeric amount', async () => {
      const dto = { amount: 'not-a-number' };

      await request(baseUrl).post('/wallet/fund').send(dto).expect(400);

      expect(mockWalletService.initializeFunding).not.toHaveBeenCalled();
    });
  });

  // ─── POST /wallet/transfer ───────────────────────────────────────────

  describe('POST /wallet/transfer', () => {
    it('should transfer funds successfully', async () => {
      const dto = {
        amount: 500,
        recipientId: 'usr_recipient01',
        description: 'Lunch money',
      };

      mockWalletService.transfer.mockResolvedValue({
        success: true,
        data: {
          senderReference: 'TRF-OUT-uuid-1',
          recipientReference: 'TRF-IN-uuid-1',
          amount: 500,
          status: 'completed',
          description: 'Lunch money',
          balance: 4500,
          bonusBalance: 250,
          promoBalance: 100,
        },
      });

      const res = await request(baseUrl).post('/wallet/transfer').send(dto).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(500);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.senderReference).toBeDefined();
      expect(res.body.data.recipientReference).toBeDefined();
      expect(mockWalletService.transfer).toHaveBeenCalledWith('usr_sender01', dto);
    });

    it('should transfer without optional description', async () => {
      const dto = {
        amount: 200,
        recipientId: 'usr_recipient02',
      };

      mockWalletService.transfer.mockResolvedValue({
        success: true,
        data: {
          senderReference: 'TRF-OUT-uuid-2',
          recipientReference: 'TRF-IN-uuid-2',
          amount: 200,
          status: 'completed',
          balance: 4800,
          bonusBalance: 250,
          promoBalance: 100,
        },
      });

      const res = await request(baseUrl).post('/wallet/transfer').send(dto).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(200);
    });

    it('should return 400 for insufficient balance', async () => {
      const dto = {
        amount: 99999,
        recipientId: 'usr_recipient01',
      };

      mockWalletService.transfer.mockRejectedValue({
        status: 400,
        message: 'Insufficient balance',
      });

      const res = await request(baseUrl).post('/wallet/transfer').send(dto).expect(400);

      expect(res.body.message).toBe('Insufficient balance');
    });

    it('should return 400 for self-transfer', async () => {
      const dto = {
        amount: 100,
        recipientId: 'usr_sender01',
      };

      mockWalletService.transfer.mockRejectedValue({
        status: 400,
        message: 'Cannot transfer to yourself',
      });

      const res = await request(baseUrl).post('/wallet/transfer').send(dto).expect(400);

      expect(res.body.message).toBe('Cannot transfer to yourself');
    });

    it('should reject transfer with missing recipientId', async () => {
      const dto = { amount: 100 };

      await request(baseUrl).post('/wallet/transfer').send(dto).expect(400);

      expect(mockWalletService.transfer).not.toHaveBeenCalled();
    });

    it('should reject transfer with missing amount', async () => {
      const dto = { recipientId: 'usr_recipient01' };

      await request(baseUrl).post('/wallet/transfer').send(dto).expect(400);

      expect(mockWalletService.transfer).not.toHaveBeenCalled();
    });

    it('should reject transfer with zero amount', async () => {
      const dto = { amount: 0, recipientId: 'usr_recipient01' };

      await request(baseUrl).post('/wallet/transfer').send(dto).expect(400);

      expect(mockWalletService.transfer).not.toHaveBeenCalled();
    });

    it('should reject transfer with empty body', async () => {
      await request(baseUrl).post('/wallet/transfer').send({}).expect(400);

      expect(mockWalletService.transfer).not.toHaveBeenCalled();
    });
  });
});

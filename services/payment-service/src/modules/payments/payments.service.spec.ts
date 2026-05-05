import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../database/prisma.service';
import { PaystackProvider } from '../payments/providers/paystack.provider';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let paystackProvider: PaystackProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            paymentIntent: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: PaystackProvider,
          useValue: {
            initializePayment: jest.fn(),
            verifyPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    paystackProvider = module.get<PaystackProvider>(PaystackProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializePayment', () => {
    it('should initialize a payment successfully', async () => {
      const userId = 'user-123';
      const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

      jest.spyOn(prisma.paymentIntent, 'create').mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'pending',
        description: dto.description,
        providerReference: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(paystackProvider, 'initializePayment').mockResolvedValue({
        reference: 'ref_123',
        authorizationUrl: 'https://paystack.com/pay/ref_123',
        accessCode: 'access_123',
      });

      jest.spyOn(prisma.paymentIntent, 'update').mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'processing',
        description: dto.description,
        providerReference: 'ref_123',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.initializePayment(userId, dto);

      expect(result.success).toBe(true);
      expect(result.data?.providerReference).toBe('ref_123');
      expect(result.data?.authorizationUrl).toBeDefined();
    });

    it('should throw BadRequestException for amount <= 0', async () => {
      const userId = 'user-123';
      const dto = { amount: 0, currency: 'NGN' };

      await expect(service.initializePayment(userId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify a payment successfully', async () => {
      const reference = 'ref_123';

      jest.spyOn(paystackProvider, 'verifyPayment').mockResolvedValue({
        status: 'success',
        amount: 1000,
        currency: 'NGN',
        paidAt: new Date(),
        customerEmail: 'test@example.com',
        reference,
      });

      jest.spyOn(prisma.paymentIntent, 'findUnique').mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'processing',
        description: null,
        providerReference: reference,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.paymentIntent, 'update').mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'completed',
        description: null,
        providerReference: reference,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.verifyPayment(reference);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });
  });
});

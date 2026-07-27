import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('WebhookService', () => {
  let service: WebhookService;

  const mockPrisma = {
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        PAYMENT_SERVICE_URL: 'http://payment-service:3003',
        SUBSCRIPTION_SERVICE_URL: 'http://subscription-service:3010',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  describe('processWebhook', () => {
    it('should process a new webhook event', async () => {
      const webhookData = {
        id: 'evt_123',
        type: 'payment.succeeded',
        payload: { amount: 1000 },
        provider: 'paystack',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.webhookEvent.create.mockResolvedValue({ ...webhookData, processedAt: new Date() });

      const result = await service.processWebhook(webhookData);
      expect(result.processed).toBe(true);
    });

    it('should skip duplicate webhook events (idempotency)', async () => {
      const webhookData = {
        id: 'evt_duplicate',
        type: 'payment.succeeded',
        payload: { amount: 1000 },
        provider: 'paystack',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue({
        id: 'evt_duplicate',
        processedAt: new Date(),
      });

      const result = await service.processWebhook(webhookData);
      expect(result.processed).toBe(false);
      expect(result.duplicate).toBe(true);
    });

    it('should handle retry storms gracefully', async () => {
      const webhookData = {
        id: 'evt_retry_storm',
        type: 'payment.failed',
        payload: { amount: 1000 },
        provider: 'flutterwave',
      };

      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.webhookEvent.create.mockResolvedValue({ ...webhookData, processedAt: new Date() });

      const result = await service.processWebhook(webhookData);
      expect(result.processed).toBe(true);
    });
  });

  describe('validateSignature', () => {
    it('should validate webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test_secret';
      const validSignature = 'e89189193be9e26b1a72e13c7f4e1d916084d40407c1d86b3b900edbac244d0f';

      expect(() => service.validateSignature(payload, validSignature, secret)).not.toThrow();
    });

    it('should throw BadRequestException for invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid_signature';

      expect(() => service.validateSignature(payload, invalidSignature, 'test_secret')).toThrow(
        BadRequestException
      );
    });
  });
});

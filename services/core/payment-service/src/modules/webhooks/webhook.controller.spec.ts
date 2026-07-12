import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller.js';
import { WebhookService, WebhookPayload } from './webhook.service.js';
import { WebhookSecurityService } from './webhook-security.service.js';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('WebhookController', () => {
  let controller: WebhookController;

  const mockWebhookSecurity = {
    isDuplicate: jest.fn(),
    verifyPaystackSignature: jest.fn(),
    verifyFlutterwaveSignature: jest.fn(),
    isReplay: jest.fn(),
    markAsProcessed: jest.fn(),
    recordInReplayWindow: jest.fn(),
  };

  const mockWebhookService = {
    handlePaystackWebhook: jest.fn(),
    handleFlutterwaveWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: WebhookSecurityService, useValue: mockWebhookSecurity },
        { provide: WebhookService, useValue: mockWebhookService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(30000) } },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePaystackWebhook', () => {
    const validPayload: WebhookPayload = {
      id: 'evt-123',
      type: 'charge.success',
      data: { reference: 'test-ref', created_at: new Date().toISOString() },
    };

    const mockReq = {
      rawBody: JSON.stringify(validPayload),
    };

    it('should reject webhook with missing reference', async () => {
      const payloadWithoutRef = {
        ...validPayload,
        data: {},
      };

      await expect(
        controller.handlePaystackWebhook(payloadWithoutRef as WebhookPayload, 'signature', mockReq)
      ).rejects.toThrow(BadRequestException);
    });

    it('should return early for duplicate webhook', async () => {
      mockWebhookSecurity.isDuplicate.mockResolvedValue(true);

      const result = await controller.handlePaystackWebhook(validPayload, 'signature', mockReq);

      expect(result).toEqual({
        success: true,
        data: { received: true, message: 'Already processed' },
      });
      expect(mockWebhookSecurity.verifyPaystackSignature).not.toHaveBeenCalled();
    });

    it('should reject webhook with invalid signature', async () => {
      mockWebhookSecurity.isDuplicate.mockResolvedValue(false);
      mockWebhookSecurity.verifyPaystackSignature.mockReturnValue(false);

      await expect(
        controller.handlePaystackWebhook(validPayload, 'invalid', mockReq)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject replayed webhook', async () => {
      mockWebhookSecurity.isDuplicate.mockResolvedValue(false);
      mockWebhookSecurity.verifyPaystackSignature.mockReturnValue(true);
      mockWebhookSecurity.isReplay.mockResolvedValue(true);

      await expect(
        controller.handlePaystackWebhook(validPayload, 'valid', mockReq)
      ).rejects.toThrow(BadRequestException);
    });

    it('should process valid webhook successfully', async () => {
      process.env.PAYSTACK_WEBHOOK_SECRET = 'test-secret';
      mockWebhookSecurity.isDuplicate.mockResolvedValue(false);
      mockWebhookSecurity.verifyPaystackSignature.mockReturnValue(true);
      mockWebhookSecurity.isReplay.mockResolvedValue(false);
      mockWebhookService.handlePaystackWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePaystackWebhook(validPayload, 'valid', mockReq);

      expect(result).toEqual({
        success: true,
        data: { received: true },
      });
      expect(mockWebhookSecurity.markAsProcessed).toHaveBeenCalledWith('test-ref');
      expect(mockWebhookSecurity.recordInReplayWindow).toHaveBeenCalledWith('test-ref');
    });
  });

  describe('handleFlutterwaveWebhook', () => {
    const validPayload: WebhookPayload = {
      id: 'evt-456',
      type: 'charge.completed',
      data: { txRef: 'test-ref', created_at: new Date().toISOString() },
    };

    const mockReq = {
      rawBody: JSON.stringify(validPayload),
    };

    it('should reject webhook with missing reference', async () => {
      const payloadWithoutRef = {
        ...validPayload,
        data: {},
      };

      await expect(
        controller.handleFlutterwaveWebhook(
          payloadWithoutRef as WebhookPayload,
          'signature',
          mockReq
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should return early for duplicate webhook', async () => {
      mockWebhookSecurity.isDuplicate.mockResolvedValue(true);

      const result = await controller.handleFlutterwaveWebhook(validPayload, 'signature', mockReq);

      expect(result).toEqual({
        success: true,
        data: { received: true, message: 'Already processed' },
      });
    });

    it('should reject webhook with invalid signature', async () => {
      mockWebhookSecurity.isDuplicate.mockResolvedValue(false);
      mockWebhookSecurity.verifyFlutterwaveSignature.mockReturnValue(false);

      await expect(
        controller.handleFlutterwaveWebhook(validPayload, 'invalid', mockReq)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject replayed webhook', async () => {
      mockWebhookSecurity.isDuplicate.mockResolvedValue(false);
      mockWebhookSecurity.verifyFlutterwaveSignature.mockReturnValue(true);
      mockWebhookSecurity.isReplay.mockResolvedValue(true);

      await expect(
        controller.handleFlutterwaveWebhook(validPayload, 'valid', mockReq)
      ).rejects.toThrow(BadRequestException);
    });

    it('should process valid webhook successfully', async () => {
      process.env.FLUTTERWAVE_WEBHOOK_SECRET = 'test-secret';
      mockWebhookSecurity.isDuplicate.mockResolvedValue(false);
      mockWebhookSecurity.verifyFlutterwaveSignature.mockReturnValue(true);
      mockWebhookSecurity.isReplay.mockResolvedValue(false);
      mockWebhookService.handleFlutterwaveWebhook.mockResolvedValue(undefined);

      const result = await controller.handleFlutterwaveWebhook(validPayload, 'valid', mockReq);

      expect(result).toEqual({
        success: true,
        data: { received: true },
      });
      expect(mockWebhookSecurity.markAsProcessed).toHaveBeenCalledWith('test-ref');
    });
  });
});

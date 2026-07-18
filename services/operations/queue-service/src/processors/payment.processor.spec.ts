import { PaymentProcessor, PaymentJobData } from './payment.processor';
import { ConfigService } from '@nestjs/config';

describe('PaymentProcessor', () => {
  let processor: PaymentProcessor;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://payment-service:3003'),
  };

  beforeEach(() => {
    processor = new PaymentProcessor(mockConfigService as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process charge job', async () => {
      const job = {
        id: '1',
        data: {
          transactionId: 'tx-1',
          userId: 'user-1',
          amount: 1000,
          currency: 'NGN',
          provider: 'paystack',
          type: 'charge',
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job<PaymentJobData>;

      await expect(processor.process(job)).resolves.not.toThrow();
    });

    it('should process refund job', async () => {
      const job = {
        id: '2',
        data: {
          transactionId: 'tx-2',
          userId: 'user-2',
          amount: 500,
          currency: 'NGN',
          provider: 'paystack',
          type: 'refund',
          metadata: { reason: 'Test refund' },
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job<PaymentJobData>;

      await expect(processor.process(job)).resolves.not.toThrow();
    });

    it('should throw on unknown payment type', async () => {
      const job = {
        id: '3',
        data: {
          transactionId: 'tx-3',
          userId: 'user-3',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'unknown',
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job<PaymentJobData>;

      await expect(processor.process(job)).rejects.toThrow();
    });
  });
});

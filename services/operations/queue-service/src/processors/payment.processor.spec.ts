import { PaymentProcessor, PaymentJobData } from './payment.processor';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';
import type { Queue } from 'bullmq';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeJob = (overrides: Partial<import('bullmq').Job<PaymentJobData>> = {}) =>
  ({
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
    opts: { attempts: 5 },
    updateData: jest.fn().mockResolvedValue(undefined),
    retry: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as import('bullmq').Job<PaymentJobData>;

describe('PaymentProcessor', () => {
  let processor: PaymentProcessor;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://payment-service:3003'),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(true),
    getValue: jest.fn(),
    getFlag: jest.fn().mockResolvedValue(null),
  };

  const mockPaymentsQueue = {
    add: jest.fn().mockResolvedValue({ id: '1' }),
  };

  const mockMetricsService = {
    incrementDlqRetryScheduled: jest.fn(),
  };

  // Flag-aware getValue defaults: worker concurrency 5, DLQ max passes 3,
  // DLQ base delay 30s. Tests override per-key via mockImplementation.
  const defaultGetValue = (key: string): Promise<unknown> => {
    const values: Record<string, unknown> = {
      [queueFlags.concurrencyPayments]: 5,
      [queueFlags.dlqRetryMaxPasses]: 3,
      [queueFlags.dlqRetryBaseDelayMs]: 30000,
    };
    return Promise.resolve(values[key] ?? null);
  };

  beforeEach(() => {
    processor = new PaymentProcessor(
      mockConfigService as unknown as ConfigService,
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockMetricsService as unknown as MetricsService,
      mockPaymentsQueue as unknown as Queue
    );
    jest.clearAllMocks();
    // Re-establish defaults: clearAllMocks keeps implementations, and tests
    // that override isEnabled/getValue would otherwise leak into later tests.
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    mockFeatureFlagService.getValue.mockImplementation(defaultGetValue);
    mockFeatureFlagService.getFlag.mockResolvedValue(null);
    mockPaymentsQueue.add.mockResolvedValue({ id: '1' });
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process charge job', async () => {
      mockedAxios.post.mockResolvedValue({ data: { status: 'success' } });
      const job = makeJob({ id: '1' });

      await expect(processor.process(job)).resolves.not.toThrow();
    });

    it('should process refund job', async () => {
      mockedAxios.post.mockResolvedValue({ data: { status: 'success' } });
      const job = makeJob({
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
      });

      await expect(processor.process(job)).resolves.not.toThrow();
    });

    it('should throw on unknown payment type', async () => {
      const job = makeJob({
        id: '3',
        data: {
          transactionId: 'tx-3',
          userId: 'user-3',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'unknown' as never,
        },
      });

      await expect(processor.process(job)).rejects.toThrow();
    });

    it('should drop the job when the payments kill-switch is off', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      const job = makeJob({ id: '4' });

      await processor.process(job);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('runtime concurrency (queue_concurrency_payments)', () => {
    it('applies the flag value to the live worker', async () => {
      const worker = { concurrency: 1 };
      (processor as unknown as { _worker: { concurrency: number } })._worker = worker;
      mockFeatureFlagService.getValue.mockResolvedValue(3);

      await processor.process(makeJob());

      expect(mockFeatureFlagService.getValue).toHaveBeenCalledWith(queueFlags.concurrencyPayments);
      expect(worker.concurrency).toBe(3);
    });

    it('falls back to the default concurrency when the flag has no value', async () => {
      const worker = { concurrency: 1 };
      (processor as unknown as { _worker: { concurrency: number } })._worker = worker;
      mockFeatureFlagService.getValue.mockResolvedValue(null);

      await processor.process(makeJob());

      expect(worker.concurrency).toBe(5);
    });

    it('does not touch a worker when none is initialized (unit instantiation)', async () => {
      await processor.process(makeJob());

      expect(mockFeatureFlagService.getValue).not.toHaveBeenCalled();
    });
  });

  describe('dead-letter retry (queue_dlq_retry)', () => {
    it('re-queues a dead-lettered job with a real delay when enabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({ id: 'dlq-1', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ dlqRetryCount: 1 })
      );
      expect(job.remove).toHaveBeenCalled();
      expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
        'payments',
        expect.objectContaining({ dlqRetryCount: 1 }),
        expect.objectContaining({
          jobId: 'dlq-1',
          delay: 30000,
          attempts: 5,
        })
      );
      // Job-level metric emitted for the scheduled pass with the base delay.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'payments',
        1,
        30000
      );
      // No immediate in-place retry in the happy path.
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('increments the tracked DLQ retry count and doubles the delay across passes', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        id: 'dlq-2',
        attemptsMade: 5,
        data: {
          transactionId: 'tx-2',
          userId: 'user-2',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'charge',
          dlqRetryCount: 1,
        },
      });

      await processor.onFailed(job, new Error('provider down'));

      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ dlqRetryCount: 2 })
      );
      expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
        'payments',
        expect.objectContaining({ dlqRetryCount: 2 }),
        expect.objectContaining({ jobId: 'dlq-2', delay: 60000 })
      );
    });

    it('uses the runtime-tuned base delay from the flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryBaseDelayMs ? 60000 : null)
      );
      const job = makeJob({ id: 'dlq-8', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockFeatureFlagService.getValue).toHaveBeenCalledWith(
        queueFlags.dlqRetryBaseDelayMs
      );
      expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
        'payments',
        expect.anything(),
        expect.objectContaining({ delay: 60000 })
      );
      // Metric carries the tuned base delay for retry-latency dashboards.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'payments',
        1,
        60000
      );
    });

    it('honors a per-job retryDelay base when the flag base is unset', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPasses ? 3 : null)
      );
      const job = makeJob({
        id: 'dlq-7',
        attemptsMade: 5,
        data: {
          transactionId: 'tx-7',
          userId: 'user-7',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'charge',
          retryDelay: 60000,
        },
      });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
        'payments',
        expect.anything(),
        expect.objectContaining({ delay: 60000 })
      );
    });

    it('honors a runtime-tuned max-pass budget from the flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPasses ? 1 : 30000)
      );
      const firstPass = makeJob({ id: 'dlq-9', attemptsMade: 5 });

      await processor.onFailed(firstPass, new Error('provider down'));
      expect(mockPaymentsQueue.add).toHaveBeenCalled();

      // Second dead-lettering is beyond the tuned budget (max 1).
      mockPaymentsQueue.add.mockClear();
      const secondPass = makeJob({
        id: 'dlq-9',
        attemptsMade: 5,
        data: {
          transactionId: 'tx-9',
          userId: 'user-9',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'charge',
          dlqRetryCount: 1,
        },
      });

      await processor.onFailed(secondPass, new Error('provider down'));
      expect(mockPaymentsQueue.add).not.toHaveBeenCalled();
      expect(secondPass.retry).not.toHaveBeenCalled();
    });

    it('leaves the job in the failed set when the flag is disabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      const job = makeJob({ id: 'dlq-3', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockPaymentsQueue.add).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
      expect(job.updateData).not.toHaveBeenCalled();
      // No metric: nothing was scheduled.
      expect(mockMetricsService.incrementDlqRetryScheduled).not.toHaveBeenCalled();
    });

    it('does not retry non-final failures (attempts not exhausted)', async () => {
      const job = makeJob({ id: 'dlq-4', attemptsMade: 2 });

      await processor.onFailed(job, new Error('transient'));

      expect(mockPaymentsQueue.add).not.toHaveBeenCalled();
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('permanently dead-letters after the max DLQ retry budget', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        id: 'dlq-5',
        attemptsMade: 5,
        data: {
          transactionId: 'tx-5',
          userId: 'user-5',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'charge',
          dlqRetryCount: 3,
        },
      });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockPaymentsQueue.add).not.toHaveBeenCalled();
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('falls back to an immediate retry when the delayed re-add fails', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockPaymentsQueue.add.mockRejectedValueOnce(new Error('redis unavailable'));
      const job = makeJob({ id: 'dlq-6', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      // The job must never be lost: keep it in the failed set via retry.
      expect(job.retry).toHaveBeenCalledWith('failed', {
        resetAttemptsMade: true,
      });
    });

    it('uses the per-queue max-pass budget when stored (queue_dlq_retry_max_passes_payments)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryMaxPassesPayments ? { key, enabled: true, value: 1 } : null
        )
      );
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPassesPayments ? 1 : 30000)
      );
      const firstPass = makeJob({ id: 'pq-1', attemptsMade: 5 });

      await processor.onFailed(firstPass, new Error('provider down'));
      expect(mockPaymentsQueue.add).toHaveBeenCalled();

      // Second dead-lettering is beyond the per-queue budget (max 1), even
      // though the shared budget is 3.
      mockPaymentsQueue.add.mockClear();
      const secondPass = makeJob({
        id: 'pq-1',
        attemptsMade: 5,
        data: {
          transactionId: 'tx-pq',
          userId: 'user-pq',
          amount: 100,
          currency: 'NGN',
          provider: 'paystack',
          type: 'charge',
          dlqRetryCount: 1,
        },
      });

      await processor.onFailed(secondPass, new Error('provider down'));
      expect(mockPaymentsQueue.add).not.toHaveBeenCalled();
      expect(secondPass.retry).not.toHaveBeenCalled();
    });

    it('uses the per-queue base delay when stored (queue_dlq_retry_base_delay_ms_payments)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryBaseDelayMsPayments
            ? { key, enabled: true, value: 120000 }
            : null
        )
      );
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryBaseDelayMsPayments ? 120000 : 30000)
      );
      const job = makeJob({ id: 'pq-2', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockPaymentsQueue.add).toHaveBeenCalledWith(
        'payments',
        expect.anything(),
        expect.objectContaining({ delay: 120000 })
      );
      // Metric carries the per-queue base delay.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'payments',
        1,
        120000
      );
    });

    it('per-queue toggle off overrides the shared toggle on (queue_dlq_retry_payments)', async () => {
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryPayments ? { key, enabled: false } : null)
      );
      // Shared switch is on; the per-queue override says off.
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryPayments ? false : true)
      );
      const job = makeJob({ id: 'pq-3', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockPaymentsQueue.add).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
      expect(job.updateData).not.toHaveBeenCalled();
    });

    it('per-queue toggle on resumes DLQ retry while the shared toggle is off', async () => {
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryPayments ? { key, enabled: true } : null)
      );
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryPayments ? true : false)
      );
      const job = makeJob({ id: 'pq-4', attemptsMade: 5 });

      await processor.onFailed(job, new Error('provider down'));

      expect(mockPaymentsQueue.add).toHaveBeenCalled();
    });
  });
});

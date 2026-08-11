import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';
import { PaymentProcessor, PaymentJobData } from './payment.processor';
import { NotificationProcessor } from './notification.processor';
import { EmailProcessor } from './email.processor';
import { EmailService, FirebaseService, SmsService } from '@azeebo/shared-services';
import type { Job } from 'bullmq';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// BullMQ's WorkerHost is abstract and its `worker` getter is what
// applyRuntimeConcurrency reads. We can't easily subclass it here, so the
// integration spec verifies DI wiring (constructor injection, onModuleInit
// lifecycle, InjectQueue token resolution) rather than BullMQ internals —
// those are covered by the unit specs.
jest.mock('@nestjs/bullmq', () => {
  const actual = jest.requireActual('@nestjs/bullmq');
  return {
    ...actual,
    WorkerHost: class MockWorkerHost {
      protected worker: unknown = null;
    },
  };
});

const makeQueue = () => ({
  add: jest.fn().mockResolvedValue({ id: 'q-1' }),
  getJob: jest.fn(),
  remove: jest.fn(),
  retryJobs: jest.fn(),
});

const makeJob = (data: Partial<PaymentJobData> = {}) =>
  ({
    id: 'job-1',
    data: {
      transactionId: 'tx-1',
      userId: 'user-1',
      amount: 1000,
      currency: 'NGN',
      provider: 'paystack',
      type: 'charge',
      ...data,
    },
    attemptsMade: 0,
    opts: { attempts: 5 },
    updateData: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    retry: jest.fn().mockResolvedValue(undefined),
  }) as unknown as Job;

describe('queue-service worker/processor paths (integration)', () => {
  let module: TestingModule;
  let paymentProcessor: PaymentProcessor;
  let notificationProcessor: NotificationProcessor;
  let emailProcessor: EmailProcessor;
  let paymentsQueue: ReturnType<typeof makeQueue>;

  const mockConfigService = {
    get: jest.fn((_key: string, fallback?: unknown) => fallback),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(true),
    getValue: jest.fn(),
    getFlag: jest.fn().mockResolvedValue(null),
  };

  const mockMetricsService = {
    incrementDlqRetryScheduled: jest.fn(),
  };

  const mockEmailService = { send: jest.fn().mockResolvedValue({ success: true }) };
  const mockFirebaseService = { sendPush: jest.fn().mockResolvedValue({ success: true }) };
  const mockSmsService = { send: jest.fn().mockResolvedValue({ success: true }) };

  const defaultGetValue = (key: string): Promise<unknown> => {
    const values: Record<string, unknown> = {
      [queueFlags.concurrencyPayments]: 5,
      [queueFlags.dlqRetryMaxPasses]: 3,
      [queueFlags.dlqRetryBaseDelayMs]: 30000,
    };
    return Promise.resolve(values[key] ?? null);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    mockFeatureFlagService.getValue.mockImplementation(defaultGetValue);

    paymentsQueue = makeQueue();

    module = await Test.createTestingModule({
      providers: [
        PaymentProcessor,
        NotificationProcessor,
        EmailProcessor,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: 'BullQueue_payments', useValue: paymentsQueue },
        { provide: 'BullQueue_notifications', useValue: makeQueue() },
        { provide: 'BullQueue_emails', useValue: makeQueue() },
        { provide: EmailService, useValue: mockEmailService },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    paymentProcessor = module.get(PaymentProcessor);
    notificationProcessor = module.get(NotificationProcessor);
    emailProcessor = module.get(EmailProcessor);
  });

  afterEach(async () => {
    await module.close();
  });

  it('wires all three processors through DI with their queue tokens', () => {
    expect(paymentProcessor).toBeDefined();
    expect(notificationProcessor).toBeDefined();
    expect(emailProcessor).toBeDefined();
  });

  it('runs onModuleInit without a live worker (no crash, concurrency skipped)', async () => {
    // Only PaymentProcessor declares onModuleInit (concurrency re-tune); with
    // no live BullMQ worker the lifecycle must no-op instead of throwing.
    await expect(paymentProcessor.onModuleInit()).resolves.toBeUndefined();
  });

  it('payment kill-switch off drops the job before any provider call', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key !== queueFlags.processPayments)
    );
    const job = makeJob();

    await paymentProcessor.process(job);

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(paymentsQueue.add).not.toHaveBeenCalled();
  });

  it('payment charge flows to the payment-service API when the flag is on', async () => {
    mockedAxios.post.mockResolvedValue({ data: { status: 'success' } });
    const job = makeJob({ transactionId: 'tx-charge' });

    await paymentProcessor.process(job);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/payments/verify'),
      expect.objectContaining({ transactionId: 'tx-charge' }),
      expect.anything()
    );
  });

  it('worker failed-event schedules a DLQ retry only when attempts are exhausted', async () => {
    const job = makeJob({ transactionId: 'tx-dlq' });
    (job as unknown as { attemptsMade: number }).attemptsMade = 5; // == max
    mockFeatureFlagService.getFlag.mockResolvedValue({
      key: queueFlags.dlqRetryPayments,
      enabled: true,
    });
    // dlqRetryEnabled() resolves the per-queue stored flag → isEnabled(dlqRetryPayments).
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === queueFlags.dlqRetryPayments)
    );

    await paymentProcessor.onFailed(job, new Error('provider down'));

    // The DLQ path re-adds to the payments queue with a delay (not job.retry).
    expect(paymentsQueue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ transactionId: 'tx-dlq', dlqRetryCount: 1 }),
      expect.objectContaining({ jobId: 'job-1', delay: expect.any(Number) })
    );
    expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalled();
  });

  it('worker failed-event leaves the job failed when DLQ retry is disabled', async () => {
    const job = makeJob({ transactionId: 'tx-nodlq' });
    (job as unknown as { attemptsMade: number }).attemptsMade = 5;
    // No stored per-queue flag → falls back to the shared flag, which is off.
    mockFeatureFlagService.getFlag.mockResolvedValue(null);
    mockFeatureFlagService.isEnabled.mockResolvedValue(false); // dlq retry off

    await paymentProcessor.onFailed(job, new Error('provider down'));

    expect(paymentsQueue.add).not.toHaveBeenCalled();
    expect(mockMetricsService.incrementDlqRetryScheduled).not.toHaveBeenCalled();
  });
});

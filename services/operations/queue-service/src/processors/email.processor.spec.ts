jest.mock('@azeebo/shared-services', () => ({
  EmailService: class {
    sendEmail = jest.fn();
  },
}));

import { EmailProcessor, EmailJobData } from './email.processor';
import { EmailService } from '@azeebo/shared-services';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';
import { Job } from 'bullmq';
import type { Queue } from 'bullmq';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailService: jest.Mocked<EmailService>;

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(true),
    getValue: jest.fn(),
    getFlag: jest.fn().mockResolvedValue(null),
  };

  const mockEmailsQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  const mockMetricsService = {
    incrementDlqRetryScheduled: jest.fn(),
  };

  // Flag-aware getValue defaults: DLQ max passes 3, base delay unset — so the
  // email processor falls back to its 60s constant (the emails queue's native
  // backoff, the longest in the app). Tests override per-key via
  // mockImplementation.
  const defaultGetValue = (key: string): Promise<unknown> => {
    const values: Record<string, unknown> = {
      [queueFlags.dlqRetryMaxPasses]: 3,
    };
    return Promise.resolve(values[key] ?? null);
  };

  beforeEach(() => {
    emailService = { sendEmail: jest.fn() } as unknown as jest.Mocked<EmailService>;

    processor = new EmailProcessor(
      emailService,
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockMetricsService as unknown as MetricsService,
      mockEmailsQueue as unknown as Queue
    );

    // Re-establish defaults: clearAllMocks keeps implementations, and tests
    // that override isEnabled/getValue would otherwise leak into later tests.
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    mockFeatureFlagService.getValue.mockImplementation(defaultGetValue);
    mockFeatureFlagService.getFlag.mockResolvedValue(null);
    mockEmailsQueue.add.mockResolvedValue({ id: 'job-1' });
  });

  afterEach(() => jest.clearAllMocks());

  function makeJob(data: EmailJobData): Job<EmailJobData> {
    return {
      id: 'job-1',
      data,
      attemptsMade: 0,
      opts: { attempts: 3 },
      updateData: jest.fn().mockResolvedValue(undefined),
      retry: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as Job<EmailJobData>;
  }

  describe('process', () => {
    it('should send the email with template and context', async () => {
      await processor.process(
        makeJob({
          to: 'user@example.com',
          subject: 'Welcome',
          template: 'welcome',
          context: { name: 'Ade' },
        })
      );

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Welcome',
        'welcome',
        { name: 'Ade' }
      );
    });

    it('should drop the job when email processing is disabled by flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);

      await processor.process(
        makeJob({
          to: 'user@example.com',
          subject: 'Welcome',
          template: 'welcome',
          context: {},
        })
      );

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should rethrow provider errors so BullMQ marks the attempt failed', async () => {
      emailService.sendEmail.mockRejectedValueOnce(new Error('provider throttle'));

      await expect(
        processor.process(
          makeJob({
            to: 'user@example.com',
            subject: 'Welcome',
            template: 'welcome',
            context: {},
          })
        )
      ).rejects.toThrow('provider throttle');
    });
  });

  describe('dead-letter retry (queue_dlq_retry)', () => {
    it('re-queues a dead-lettered job with a real delay when enabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.id = 'dlq-1';
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ dlqRetryCount: 1 })
      );
      expect(job.remove).toHaveBeenCalled();
      expect(mockEmailsQueue.add).toHaveBeenCalledWith(
        'emails',
        expect.objectContaining({ dlqRetryCount: 1 }),
        expect.objectContaining({
          jobId: 'dlq-1',
          delay: 60000,
          attempts: 3,
        })
      );
      // Job-level metric emitted for the scheduled pass with the base delay.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'emails',
        1,
        60000
      );
      // No immediate in-place retry in the happy path.
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('increments the tracked DLQ retry count and doubles the delay across passes', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
        dlqRetryCount: 1,
      });
      job.id = 'dlq-2';
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ dlqRetryCount: 2 })
      );
      expect(mockEmailsQueue.add).toHaveBeenCalledWith(
        'emails',
        expect.objectContaining({ dlqRetryCount: 2 }),
        expect.objectContaining({ jobId: 'dlq-2', delay: 120000 })
      );
    });

    it('uses the runtime-tuned base delay from the flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryBaseDelayMs ? 90000 : null)
      );
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockFeatureFlagService.getValue).toHaveBeenCalledWith(
        queueFlags.dlqRetryBaseDelayMs
      );
      expect(mockEmailsQueue.add).toHaveBeenCalledWith(
        'emails',
        expect.anything(),
        expect.objectContaining({ delay: 90000 })
      );
      // Metric carries the tuned base delay for retry-latency dashboards.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'emails',
        1,
        90000
      );
    });

    it('honors a per-job retryDelay base when the flag base is unset', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPasses ? 3 : null)
      );
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
        retryDelay: 45000,
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockEmailsQueue.add).toHaveBeenCalledWith(
        'emails',
        expect.anything(),
        expect.objectContaining({ delay: 45000 })
      );
    });

    it('honors a runtime-tuned max-pass budget from the flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPasses ? 1 : null)
      );
      const firstPass = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      firstPass.attemptsMade = 3;

      await processor.onFailed(firstPass, new Error('provider down'));
      expect(mockEmailsQueue.add).toHaveBeenCalled();

      // Second dead-lettering is beyond the tuned budget (max 1).
      mockEmailsQueue.add.mockClear();
      const secondPass = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
        dlqRetryCount: 1,
      });
      secondPass.attemptsMade = 3;

      await processor.onFailed(secondPass, new Error('provider down'));
      expect(mockEmailsQueue.add).not.toHaveBeenCalled();
      expect(secondPass.retry).not.toHaveBeenCalled();
    });

    it('leaves the job in the failed set when the flag is disabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockEmailsQueue.add).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
      expect(job.updateData).not.toHaveBeenCalled();
      // No metric: nothing was scheduled.
      expect(mockMetricsService.incrementDlqRetryScheduled).not.toHaveBeenCalled();
    });

    it('does not retry non-final failures (attempts not exhausted)', async () => {
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 1;

      await processor.onFailed(job, new Error('transient'));

      expect(mockEmailsQueue.add).not.toHaveBeenCalled();
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('permanently dead-letters after the max DLQ retry budget', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
        dlqRetryCount: 3,
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockEmailsQueue.add).not.toHaveBeenCalled();
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('falls back to an immediate retry when the delayed re-add fails', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockEmailsQueue.add.mockRejectedValueOnce(new Error('redis unavailable'));
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      // The job must never be lost: keep it in the failed set via retry.
      expect(job.retry).toHaveBeenCalledWith('failed', {
        resetAttemptsMade: true,
      });
    });

    it('uses the per-queue max-pass budget when stored (queue_dlq_retry_max_passes_emails)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryMaxPassesEmails ? { key, enabled: true, value: 1 } : null
        )
      );
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPassesEmails ? 1 : 30000)
      );
      const firstPass = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      firstPass.attemptsMade = 3;

      await processor.onFailed(firstPass, new Error('provider down'));
      expect(mockEmailsQueue.add).toHaveBeenCalled();

      // Second dead-lettering is beyond the per-queue budget (max 1), even
      // though the shared budget is 3.
      mockEmailsQueue.add.mockClear();
      const secondPass = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
        dlqRetryCount: 1,
      });
      secondPass.attemptsMade = 3;

      await processor.onFailed(secondPass, new Error('provider down'));
      expect(mockEmailsQueue.add).not.toHaveBeenCalled();
      expect(secondPass.retry).not.toHaveBeenCalled();
    });

    it('uses the per-queue base delay when stored (queue_dlq_retry_base_delay_ms_emails)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryBaseDelayMsEmails
            ? { key, enabled: true, value: 120000 }
            : null
        )
      );
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryBaseDelayMsEmails ? 120000 : 30000)
      );
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockEmailsQueue.add).toHaveBeenCalledWith(
        'emails',
        expect.anything(),
        expect.objectContaining({ delay: 120000 })
      );
      // Metric carries the per-queue base delay.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'emails',
        1,
        120000
      );
    });

    it('per-queue toggle off overrides the shared toggle on (queue_dlq_retry_emails)', async () => {
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryEmails ? { key, enabled: false } : null)
      );
      // Shared switch is on; the per-queue override says off.
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryEmails ? false : true)
      );
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockEmailsQueue.add).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
      expect(job.updateData).not.toHaveBeenCalled();
    });

    it('per-queue toggle on resumes DLQ retry while the shared toggle is off', async () => {
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryEmails ? { key, enabled: true } : null)
      );
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryEmails ? true : false)
      );
      const job = makeJob({
        to: 'user@example.com',
        subject: 'Welcome',
        template: 'welcome',
        context: {},
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockEmailsQueue.add).toHaveBeenCalled();
    });
  });
});

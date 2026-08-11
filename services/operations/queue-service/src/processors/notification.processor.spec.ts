jest.mock('@azeebo/shared-services', () => ({
  EmailService: class {
    sendCustomEmail = jest.fn();
  },
  FirebaseService: class {
    sendPushNotification = jest.fn();
  },
  SmsService: class {
    sendSms = jest.fn();
  },
}));

import { NotificationProcessor, NotificationJobData } from './notification.processor';
import { EmailService, FirebaseService, SmsService } from '@azeebo/shared-services';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';
import { Job } from 'bullmq';
import type { Queue } from 'bullmq';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let emailService: jest.Mocked<EmailService>;
  let firebaseService: jest.Mocked<FirebaseService>;
  let smsService: jest.Mocked<SmsService>;

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(true),
    getValue: jest.fn(),
    getFlag: jest.fn().mockResolvedValue(null),
  };

  const mockNotificationsQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  const mockMetricsService = {
    incrementDlqRetryScheduled: jest.fn(),
  };

  // Flag-aware getValue defaults: DLQ max passes 3, base delay 30s. Tests
  // override per-key via mockImplementation.
  const defaultGetValue = (key: string): Promise<unknown> => {
    const values: Record<string, unknown> = {
      [queueFlags.dlqRetryMaxPasses]: 3,
      [queueFlags.dlqRetryBaseDelayMs]: 30000,
    };
    return Promise.resolve(values[key] ?? null);
  };

  beforeEach(() => {
    emailService = { sendCustomEmail: jest.fn() } as unknown as jest.Mocked<EmailService>;
    firebaseService = {
      sendPushNotification: jest.fn(),
    } as unknown as jest.Mocked<FirebaseService>;
    smsService = { sendSms: jest.fn() } as unknown as jest.Mocked<SmsService>;

    processor = new NotificationProcessor(
      emailService,
      firebaseService,
      smsService,
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockMetricsService as unknown as MetricsService,
      mockNotificationsQueue as unknown as Queue
    );

    // Re-establish defaults: clearAllMocks keeps implementations, and tests
    // that override isEnabled/getValue would otherwise leak into later tests.
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    mockFeatureFlagService.getValue.mockImplementation(defaultGetValue);
    mockFeatureFlagService.getFlag.mockResolvedValue(null);
    mockNotificationsQueue.add.mockResolvedValue({ id: 'job-1' });
  });

  afterEach(() => jest.clearAllMocks());

  function makeJob(data: NotificationJobData): Job<NotificationJobData> {
    return {
      id: 'job-1',
      data,
      attemptsMade: 0,
      opts: { attempts: 3 },
      updateData: jest.fn().mockResolvedValue(undefined),
      retry: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as Job<NotificationJobData>;
  }

  describe('process - push', () => {
    it('should send push notification to all tokens', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'push',
          title: 'Hello',
          message: 'World',
          pushTokens: ['token-a', 'token-b'],
        })
      );

      expect(firebaseService.sendPushNotification).toHaveBeenCalledTimes(2);
      expect(firebaseService.sendPushNotification).toHaveBeenCalledWith(
        'token-a',
        'Hello',
        'World',
        undefined
      );
    });

    it('should handle empty push tokens gracefully', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'push',
          title: 'Hello',
          message: 'World',
          pushTokens: [],
        })
      );

      expect(firebaseService.sendPushNotification).not.toHaveBeenCalled();
    });
  });

  describe('process - email', () => {
    it('should send email when address is provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'email',
          title: 'Welcome',
          message: 'Welcome to Azeebo+',
          email: 'user@example.com',
        })
      );

      expect(emailService.sendCustomEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Welcome',
        '<p>Welcome to Azeebo+</p>'
      );
    });

    it('should escape HTML in email body', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'email',
          title: 'Alert',
          message: '<script>alert("xss")</script>',
          email: 'user@example.com',
        })
      );

      expect(emailService.sendCustomEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Alert',
        '<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>'
      );
    });

    it('should skip email when no address provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'email',
          title: 'Hello',
          message: 'World',
        })
      );

      expect(emailService.sendCustomEmail).not.toHaveBeenCalled();
    });
  });

  describe('process - sms', () => {
    it('should send SMS when phone number is provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'sms',
          title: 'Alert',
          message: 'Your code is 1234',
          phone: '+2348012345678',
        })
      );

      expect(smsService.sendSms).toHaveBeenCalledWith('+2348012345678', 'Your code is 1234');
    });

    it('should skip SMS when no phone number provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'sms',
          title: 'Alert',
          message: 'Your code is 1234',
        })
      );

      expect(smsService.sendSms).not.toHaveBeenCalled();
    });
  });

  describe('process - unknown type', () => {
    it('should throw for unknown notification type', async () => {
      await expect(
        processor.process(
          makeJob({
            userId: 'user-1',
            type: 'unknown' as NotificationJobData['type'],
            title: 'Hello',
            message: 'World',
          })
        )
      ).rejects.toThrow('Unknown notification type: unknown');
    });
  });

  describe('dead-letter retry (queue_dlq_retry)', () => {
    it('re-queues a dead-lettered job with a real delay when enabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        userId: 'user-1',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.id = 'dlq-1';
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ dlqRetryCount: 1 })
      );
      expect(job.remove).toHaveBeenCalled();
      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({ dlqRetryCount: 1 }),
        expect.objectContaining({
          jobId: 'dlq-1',
          delay: 30000,
          attempts: 3,
        })
      );
      // Job-level metric emitted for the scheduled pass with the base delay.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'notifications',
        1,
        30000
      );
      // No immediate in-place retry in the happy path.
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('increments the tracked DLQ retry count and doubles the delay across passes', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        userId: 'user-2',
        type: 'sms',
        title: 'Alert',
        message: 'Your code is 1234',
        phone: '+2348012345678',
        dlqRetryCount: 1,
      });
      job.id = 'dlq-2';
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ dlqRetryCount: 2 })
      );
      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({ dlqRetryCount: 2 }),
        expect.objectContaining({ jobId: 'dlq-2', delay: 60000 })
      );
    });

    it('uses the runtime-tuned base delay from the flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryBaseDelayMs ? 60000 : null)
      );
      const job = makeJob({
        userId: 'user-3',
        type: 'push',
        title: 'Hello',
        message: 'World',
        pushTokens: ['token-a'],
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockFeatureFlagService.getValue).toHaveBeenCalledWith(
        queueFlags.dlqRetryBaseDelayMs
      );
      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        'notifications',
        expect.anything(),
        expect.objectContaining({ delay: 60000 })
      );
      // Metric carries the tuned base delay for retry-latency dashboards.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'notifications',
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
        userId: 'user-4',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
        retryDelay: 60000,
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        'notifications',
        expect.anything(),
        expect.objectContaining({ delay: 60000 })
      );
    });

    it('honors a runtime-tuned max-pass budget from the flag', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPasses ? 1 : 30000)
      );
      const firstPass = makeJob({
        userId: 'user-5',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      firstPass.attemptsMade = 3;

      await processor.onFailed(firstPass, new Error('provider down'));
      expect(mockNotificationsQueue.add).toHaveBeenCalled();

      // Second dead-lettering is beyond the tuned budget (max 1).
      mockNotificationsQueue.add.mockClear();
      const secondPass = makeJob({
        userId: 'user-5',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
        dlqRetryCount: 1,
      });
      secondPass.attemptsMade = 3;

      await processor.onFailed(secondPass, new Error('provider down'));
      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
      expect(secondPass.retry).not.toHaveBeenCalled();
    });

    it('leaves the job in the failed set when the flag is disabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      const job = makeJob({
        userId: 'user-6',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
      expect(job.updateData).not.toHaveBeenCalled();
      // No metric: nothing was scheduled.
      expect(mockMetricsService.incrementDlqRetryScheduled).not.toHaveBeenCalled();
    });

    it('does not retry non-final failures (attempts not exhausted)', async () => {
      const job = makeJob({
        userId: 'user-7',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.attemptsMade = 1;

      await processor.onFailed(job, new Error('transient'));

      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('permanently dead-letters after the max DLQ retry budget', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      const job = makeJob({
        userId: 'user-8',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
        dlqRetryCount: 3,
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
      expect(job.retry).not.toHaveBeenCalled();
    });

    it('falls back to an immediate retry when the delayed re-add fails', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockNotificationsQueue.add.mockRejectedValueOnce(new Error('redis unavailable'));
      const job = makeJob({
        userId: 'user-9',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      // The job must never be lost: keep it in the failed set via retry.
      expect(job.retry).toHaveBeenCalledWith('failed', {
        resetAttemptsMade: true,
      });
    });

    it('uses the per-queue max-pass budget when stored (queue_dlq_retry_max_passes_notifications)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryMaxPassesNotifications
            ? { key, enabled: true, value: 1 }
            : null
        )
      );
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryMaxPassesNotifications ? 1 : 30000)
      );
      const firstPass = makeJob({
        userId: 'user-pq',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      firstPass.attemptsMade = 3;

      await processor.onFailed(firstPass, new Error('provider down'));
      expect(mockNotificationsQueue.add).toHaveBeenCalled();

      // Second dead-lettering is beyond the per-queue budget (max 1), even
      // though the shared budget is 3.
      mockNotificationsQueue.add.mockClear();
      const secondPass = makeJob({
        userId: 'user-pq',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
        dlqRetryCount: 1,
      });
      secondPass.attemptsMade = 3;

      await processor.onFailed(secondPass, new Error('provider down'));
      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
      expect(secondPass.retry).not.toHaveBeenCalled();
    });

    it('uses the per-queue base delay when stored (queue_dlq_retry_base_delay_ms_notifications)', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryBaseDelayMsNotifications
            ? { key, enabled: true, value: 120000 }
            : null
        )
      );
      mockFeatureFlagService.getValue.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryBaseDelayMsNotifications ? 120000 : 30000)
      );
      const job = makeJob({
        userId: 'user-pq',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        'notifications',
        expect.anything(),
        expect.objectContaining({ delay: 120000 })
      );
      // Metric carries the per-queue base delay.
      expect(mockMetricsService.incrementDlqRetryScheduled).toHaveBeenCalledWith(
        'notifications',
        1,
        120000
      );
    });

    it('per-queue toggle off overrides the shared toggle on (queue_dlq_retry_notifications)', async () => {
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(
          key === queueFlags.dlqRetryNotifications ? { key, enabled: false } : null
        )
      );
      // Shared switch is on; the per-queue override says off.
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryNotifications ? false : true)
      );
      const job = makeJob({
        userId: 'user-pq',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
      expect(job.updateData).not.toHaveBeenCalled();
    });

    it('per-queue toggle on resumes DLQ retry while the shared toggle is off', async () => {
      mockFeatureFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryNotifications ? { key, enabled: true } : null)
      );
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === queueFlags.dlqRetryNotifications ? true : false)
      );
      const job = makeJob({
        userId: 'user-pq',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to Azeebo+',
        email: 'user@example.com',
      });
      job.attemptsMade = 3;

      await processor.onFailed(job, new Error('provider down'));

      expect(mockNotificationsQueue.add).toHaveBeenCalled();
    });
  });
});

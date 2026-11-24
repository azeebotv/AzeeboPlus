import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService, FirebaseService, SmsService } from '@azeebo/shared-services';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';

// Per CLAUDE.md § Cross-Service Model Duplication, queue-service references
// `userId` as a plain string and does NOT query the User or PushToken tables.
// The producer (notification-service) supplies the contact info in the payload.
export interface NotificationJobData {
  userId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  message: string;
  data?: Record<string, string>;
  // Contact details supplied by the producer (notification-service) so the
  // queue worker does not need to read another service's canonical data.
  email?: string;
  phone?: string;
  pushTokens?: string[];
  maxRetries?: number;
  retryDelay?: number;
  // Dead-letter retry pass counter, persisted by the worker before re-adding
  // the job (see maybeDeadLetterRetry). Absent on the first attempt.
  dlqRetryCount?: number;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private static readonly DEFAULT_MAX_RETRIES = 3;
  // Dead-letter retry policy defaults, overridable via the same numeric flags
  // the payment processor consumes (queue_dlq_retry_max_passes / base delay).
  private static readonly DEFAULT_DLQ_MAX_RETRIES = 3;
  private static readonly DEFAULT_DLQ_RETRY_BASE_DELAY_MS = 30_000;
  // Cap on a single DLQ retry delay regardless of how high ops tunes the base.
  private static readonly DLQ_RETRY_MAX_DELAY_MS = 3_600_000;

  constructor(
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
    private readonly smsService: SmsService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly metricsService: MetricsService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    // Kill-switch: when disabled, drop the job (marking complete) so the queue
    // drains without sending; ops can flip back on and resume delivery.
    if (!(await this.featureFlagService.isEnabled(queueFlags.processNotifications))) {
      this.logger.warn(`Notification processing disabled by flag; dropping job ${job.id}`);
      return;
    }

    this.logger.log(`Processing notification job ${job.id} (attempt ${job.attemptsMade + 1})`);

    const { userId, type, title } = job.data;

    try {
      switch (type) {
        case 'push':
          await this.sendPushNotification(job.data);
          break;
        case 'email':
          await this.sendEmail(job.data);
          break;
        case 'sms':
          await this.sendSms(job.data);
          break;
        default:
          this.logger.warn(`Unknown notification type: ${type}`);
          throw new Error(`Unknown notification type: ${type}`);
      }

      this.logger.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification (attempt ${job.attemptsMade + 1}/${NotificationProcessor.DEFAULT_MAX_RETRIES}): ${(error as Error).message}`,
        { jobId: job.id, userId, type }
      );
      throw error;
    }
  }

  private async sendPushNotification(jobData: NotificationJobData): Promise<void> {
    const { userId, title, message, data, pushTokens } = jobData;
    this.logger.log(`Sending push notification to ${userId}: ${title}`);
    for (const token of pushTokens ?? []) {
      await this.firebaseService.sendPushNotification(token, title, message, data);
    }
  }

  private async sendEmail(jobData: NotificationJobData): Promise<void> {
    const { userId, title, message, email } = jobData;
    this.logger.log(`Sending email to ${userId}: ${title}`);
    if (email) {
      const escapedBody = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      await this.emailService.sendCustomEmail(email, title, `<p>${escapedBody}</p>`);
    } else {
      this.logger.warn(`No email address in payload for user ${userId}; skipping email`);
    }
  }

  private async sendSms(jobData: NotificationJobData): Promise<void> {
    const { userId, message, phone } = jobData;
    this.logger.log(`Sending SMS to ${userId}`);
    if (phone) {
      await this.smsService.sendSms(phone, message);
    } else {
      this.logger.warn(`No phone number in payload for user ${userId}; skipping SMS`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active and processing`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully (attempts: ${job.attemptsMade + 1})`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NotificationJobData>, error: Error) {
    this.logger.error(
      `Notification job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${(error as Error).message}`,
      {
        jobId: job.id,
        userId: job.data?.userId,
        error: (error as Error).message,
        attemptsMade: job.attemptsMade,
      }
    );

    // Dead-letter retry: the 'failed' event fires on every attempt, but only
    // when the attempts budget is exhausted is the job truly dead-lettered.
    const maxAttempts = job.opts.attempts ?? NotificationProcessor.DEFAULT_MAX_RETRIES;
    if (job.attemptsMade >= maxAttempts) {
      await this.maybeDeadLetterRetry(job);
    }
  }

  /**
   * Re-queues a dead-lettered notification job when queue_dlq_retry is
   * enabled, up to the runtime-tunable max-passes budget, each with a real
   * delay. Mirrors the payment processor: BullMQ cannot delay-retry an
   * existing failed job, so the job is removed and re-added with the same
   * jobId and a delay — a fresh attempts budget (equivalent to
   * resetAttemptsMade) with exponential delay across passes (base → 2×base →
   * 4×base, capped at 1h). Passes are tracked in job.data.dlqRetryCount.
   * When the flag is disabled (or the budget exhausted) the job stays in the
   * failed set for manual retry via the queue admin endpoints.
   */
  private async maybeDeadLetterRetry(job: Job<NotificationJobData>): Promise<void> {
    try {
      if (!(await this.dlqRetryEnabled())) {
        this.logger.warn(
          `Notification job ${job.id} dead-lettered (dlq retry disabled); leaving in failed set`
        );
        return;
      }

      // Runtime-tunable policy (queue_dlq_retry_max_passes + base delay): read
      // fresh on every final failure so ops changes apply within the flag
      // cache TTL. Flag value wins over the enqueuer's per-job retryDelay;
      // both fall back to the constants.
      const [maxRetries, baseDelayMs] = await Promise.all([
        this.dlqMaxRetries(),
        this.dlqBaseDelayMs(job.data?.retryDelay),
      ]);

      const dlqCount = job.data?.dlqRetryCount ?? 0;
      if (dlqCount >= maxRetries) {
        this.logger.error(
          `Notification job ${job.id} permanently dead-lettered after ${dlqCount} DLQ retries (max ${maxRetries})`
        );
        return;
      }

      const nextPass = dlqCount + 1;
      const updatedData: NotificationJobData = { ...job.data, dlqRetryCount: nextPass };
      const delay = this.dlqRetryDelay(nextPass, baseDelayMs);

      // Persist the pass count before mutating the job so an interruption
      // mid-retry never resets the budget.
      await job.updateData(updatedData);
      await job.remove();
      await this.notificationsQueue.add('notifications', updatedData, {
        jobId: job.id,
        delay,
        attempts: job.opts.attempts,
        backoff: job.opts.backoff,
      });

      // Job-level metric: one counter increment per DLQ pass actually
      // scheduled, labeled with the queue, pass number, and the effective
      // base delay — feeds retry-latency dashboards and shows runtime tuning
      // changes in the flag.
      this.metricsService.incrementDlqRetryScheduled('notifications', nextPass, baseDelayMs);

      this.logger.warn(
        `Notification job ${job.id} dead-letter retry #${nextPass}/${maxRetries} scheduled in ${delay}ms`
      );
    } catch (retryError) {
      // Never let DLQ bookkeeping crash the worker. If the delayed re-add
      // fails, fall back to an immediate in-place retry so the job is not
      // lost; ops can still tune the flag or retry manually.
      this.logger.error(
        `Failed to schedule delayed DLQ retry for notification job ${job.id}: ${(retryError as Error).message}`
      );
      try {
        await job.retry('failed', { resetAttemptsMade: true });
      } catch (fallbackError) {
        this.logger.error(
          `Fallback retry for notification job ${job.id} also failed: ${(fallbackError as Error).message}`
        );
      }
    }
  }

  /**
   * Dead-letter retry toggle for notifications. The per-queue flag
   * (queue_dlq_retry_notifications), when explicitly stored, overrides the
   * shared queue_dlq_retry — so ops can pause or resume DLQ retry for
   * notifications independently of the other queues. Unset per-queue flags
   * follow the shared switch. Stored-ness is checked via getFlag (not
   * isEnabled) because the admin UI lists the per-queue toggle as default-on.
   */
  private async dlqRetryEnabled(): Promise<boolean> {
    const perQueue = await this.featureFlagService.getFlag(queueFlags.dlqRetryNotifications);
    if (perQueue) {
      return this.featureFlagService.isEnabled(queueFlags.dlqRetryNotifications);
    }
    return this.featureFlagService.isEnabled(queueFlags.dlqRetry);
  }

  /** Max DLQ passes for notifications: the per-queue flag
   * (queue_dlq_retry_max_passes_notifications) when stored, else the shared
   * queue_dlq_retry_max_passes, else the fallback constant (positive
   * integer). */
  private async dlqMaxRetries(): Promise<number> {
    const perQueue = await this.featureFlagService.getFlag(
      queueFlags.dlqRetryMaxPassesNotifications
    );
    const value = perQueue
      ? await this.featureFlagService.getValue(queueFlags.dlqRetryMaxPassesNotifications)
      : await this.featureFlagService.getValue(queueFlags.dlqRetryMaxPasses);
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
      return Math.floor(value);
    }
    return NotificationProcessor.DEFAULT_DLQ_MAX_RETRIES;
  }

  /** Base DLQ delay in ms for notifications: the per-queue flag
   * (queue_dlq_retry_base_delay_ms_notifications) when stored, else the
   * shared queue_dlq_retry_base_delay_ms, else the enqueuer's per-job
   * retryDelay, then the constant (positive number). */
  private async dlqBaseDelayMs(jobBaseMs?: number): Promise<number> {
    const perQueue = await this.featureFlagService.getFlag(
      queueFlags.dlqRetryBaseDelayMsNotifications
    );
    const value = perQueue
      ? await this.featureFlagService.getValue(queueFlags.dlqRetryBaseDelayMsNotifications)
      : await this.featureFlagService.getValue(queueFlags.dlqRetryBaseDelayMs);
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof jobBaseMs === 'number' && Number.isFinite(jobBaseMs) && jobBaseMs > 0) {
      return jobBaseMs;
    }
    return NotificationProcessor.DEFAULT_DLQ_RETRY_BASE_DELAY_MS;
  }

  /** Exponential DLQ delay: base doubles per pass, capped to avoid
   * pathological requeue loops. */
  private dlqRetryDelay(pass: number, baseMs: number): number {
    return Math.min(baseMs * 2 ** (pass - 1), NotificationProcessor.DLQ_RETRY_MAX_DELAY_MS);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(`Job ${job.id} has stalled - it might need to be reprocessed`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log('All jobs have been processed, worker is idle');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker encountered an error: ${(error as Error).message}`, {
      stack: (error as Error).stack,
    });
  }
}

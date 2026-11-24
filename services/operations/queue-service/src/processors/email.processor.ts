import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { pseudonymizeIdentifier } from '@azeebo/security';
import { EmailService } from '@azeebo/shared-services';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
  /** Number of times this job has been re-queued after dead-lettering (tracked by the processor). */
  dlqRetryCount?: number;
}

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private static readonly DEFAULT_MAX_RETRIES = 3;
  // Dead-letter retry policy defaults, overridable via the shared numeric
  // flags (queue_dlq_retry_max_passes / base delay) or the per-queue email
  // overrides (queue_dlq_retry_*_emails) that win when stored. The base delay
  // defaults to 60s — matching the emails queue's native exponential backoff
  // (the longest in the app) — because email is the most provider-throttle-
  // prone surface; a slower DLQ cadence gives the provider time to recover
  // before the next attempt.
  private static readonly DEFAULT_DLQ_MAX_RETRIES = 3;
  private static readonly DEFAULT_DLQ_RETRY_BASE_DELAY_MS = 60_000;
  // Cap on a single DLQ retry delay regardless of how high ops tunes the base.
  private static readonly DLQ_RETRY_MAX_DELAY_MS = 3_600_000;

  constructor(
    private readonly emailService: EmailService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly metricsService: MetricsService,
    @InjectQueue('emails') private readonly emailsQueue: Queue
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    // Kill-switch: when disabled, drop the job so the email queue drains.
    if (!(await this.featureFlagService.isEnabled(queueFlags.processEmails))) {
      this.logger.warn(`Email processing disabled by flag; dropping job ${job.id}`);
      return;
    }

    this.logger.log(`Processing email job ${job.id} (attempt ${job.attemptsMade + 1})`);

    const { to, subject, template, context } = job.data;

    try {
      await this.sendEmail(to, subject, template, context);
      this.logger.log(`Email sent to ${pseudonymizeIdentifier(to)}: ${subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email (attempt ${job.attemptsMade + 1}/${EmailProcessor.DEFAULT_MAX_RETRIES}): ${(error as Error).message}`,
        { jobId: job.id, to: pseudonymizeIdentifier(to), subject, template }
      );
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, string>
  ): Promise<void> {
    this.logger.log(`Sending email to ${pseudonymizeIdentifier(to)} using template ${template}`);
    await this.emailService.sendEmail(to, subject, template, context);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Email job ${job.id} is now active and processing`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Email job ${job.id} completed successfully (attempts: ${job.attemptsMade + 1})`
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EmailJobData>, error: Error) {
    this.logger.error(
      `Email job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${(error as Error).message}`,
      {
        jobId: job.id,
        to: job.data?.to,
        error: (error as Error).message,
        attemptsMade: job.attemptsMade,
      }
    );

    // Dead-letter retry: the 'failed' event fires on every attempt, but only
    // when the attempts budget is exhausted is the job truly dead-lettered.
    const maxAttempts = job.opts.attempts ?? EmailProcessor.DEFAULT_MAX_RETRIES;
    if (job.attemptsMade >= maxAttempts) {
      await this.maybeDeadLetterRetry(job);
    }
  }

  /**
   * Re-queues a dead-lettered email job when queue_dlq_retry is enabled, up
   * to the runtime-tunable max-passes budget, each with a real delay. Mirrors
   * the payment/notification processors: BullMQ cannot delay-retry an existing
   * failed job, so the job is removed and re-added with the same jobId and a
   * delay — a fresh attempts budget (equivalent to resetAttemptsMade) with
   * exponential delay across passes (60s → 120s → 240s, capped at 1h). Passes
   * are tracked in job.data.dlqRetryCount. When the flag is disabled (or the
   * budget exhausted) the job stays in the failed set for manual retry via
   * the queue admin endpoints.
   */
  private async maybeDeadLetterRetry(job: Job<EmailJobData>): Promise<void> {
    try {
      if (!(await this.dlqRetryEnabled())) {
        this.logger.warn(
          `Email job ${job.id} dead-lettered (dlq retry disabled); leaving in failed set`
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
          `Email job ${job.id} permanently dead-lettered after ${dlqCount} DLQ retries (max ${maxRetries})`
        );
        return;
      }

      const nextPass = dlqCount + 1;
      const updatedData: EmailJobData = { ...job.data, dlqRetryCount: nextPass };
      const delay = this.dlqRetryDelay(nextPass, baseDelayMs);

      // Persist the pass count before mutating the job so an interruption
      // mid-retry never resets the budget.
      await job.updateData(updatedData);
      await job.remove();
      await this.emailsQueue.add('emails', updatedData, {
        jobId: job.id,
        delay,
        attempts: job.opts.attempts,
        backoff: job.opts.backoff,
      });

      // Job-level metric: one counter increment per DLQ pass actually
      // scheduled, labeled with the queue, pass number, and the effective
      // base delay — feeds retry-latency dashboards and shows runtime tuning
      // changes in the flag.
      this.metricsService.incrementDlqRetryScheduled('emails', nextPass, baseDelayMs);

      this.logger.warn(
        `Email job ${job.id} dead-letter retry #${nextPass}/${maxRetries} scheduled in ${delay}ms`
      );
    } catch (retryError) {
      // Never let DLQ bookkeeping crash the worker. If the delayed re-add
      // fails, fall back to an immediate in-place retry so the job is not
      // lost; ops can still tune the flag or retry manually.
      this.logger.error(
        `Failed to schedule delayed DLQ retry for email job ${job.id}: ${(retryError as Error).message}`
      );
      try {
        await job.retry('failed', { resetAttemptsMade: true });
      } catch (fallbackError) {
        this.logger.error(
          `Fallback retry for email job ${job.id} also failed: ${(fallbackError as Error).message}`
        );
      }
    }
  }

  /** DLQ retry switch for emails: the per-queue flag
   * (queue_dlq_retry_emails) when stored, else the shared queue_dlq_retry. */
  private async dlqRetryEnabled(): Promise<boolean> {
    const perQueue = await this.featureFlagService.getFlag(queueFlags.dlqRetryEmails);
    if (perQueue) {
      return this.featureFlagService.isEnabled(queueFlags.dlqRetryEmails);
    }
    return this.featureFlagService.isEnabled(queueFlags.dlqRetry);
  }

  /** Max DLQ passes for emails: the per-queue flag
   * (queue_dlq_retry_max_passes_emails) when stored, else the shared
   * queue_dlq_retry_max_passes, else the fallback constant (positive
   * integer). */
  private async dlqMaxRetries(): Promise<number> {
    const perQueue = await this.featureFlagService.getFlag(queueFlags.dlqRetryMaxPassesEmails);
    const value = perQueue
      ? await this.featureFlagService.getValue(queueFlags.dlqRetryMaxPassesEmails)
      : await this.featureFlagService.getValue(queueFlags.dlqRetryMaxPasses);
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
      return Math.floor(value);
    }
    return EmailProcessor.DEFAULT_DLQ_MAX_RETRIES;
  }

  /** Base DLQ delay in ms for emails: the per-queue flag
   * (queue_dlq_retry_base_delay_ms_emails) when stored, else the shared
   * queue_dlq_retry_base_delay_ms, else the enqueuer's per-job retryDelay,
   * then the constant (positive number). */
  private async dlqBaseDelayMs(jobBaseMs?: number): Promise<number> {
    const perQueue = await this.featureFlagService.getFlag(queueFlags.dlqRetryBaseDelayMsEmails);
    const value = perQueue
      ? await this.featureFlagService.getValue(queueFlags.dlqRetryBaseDelayMsEmails)
      : await this.featureFlagService.getValue(queueFlags.dlqRetryBaseDelayMs);
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof jobBaseMs === 'number' && Number.isFinite(jobBaseMs) && jobBaseMs > 0) {
      return jobBaseMs;
    }
    return EmailProcessor.DEFAULT_DLQ_RETRY_BASE_DELAY_MS;
  }

  /** Exponential DLQ delay: base doubles per pass, capped to avoid
   * pathological requeue loops. */
  private dlqRetryDelay(pass: number, baseMs: number): number {
    return Math.min(baseMs * 2 ** (pass - 1), EmailProcessor.DLQ_RETRY_MAX_DELAY_MS);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(`Email job ${job.id} has stalled - it might need to be reprocessed`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(`Email job ${job.id} progress: ${JSON.stringify(progress)}`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log('All email jobs have been processed, worker is idle');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Email worker encountered an error: ${(error as Error).message}`, {
      stack: (error as Error).stack,
    });
  }
}

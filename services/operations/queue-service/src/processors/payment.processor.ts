import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, Worker } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../modules/metrics/metrics.service';

export interface PaymentJobData {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: 'paystack' | 'flutterwave';
  type: 'charge' | 'refund' | 'payout';
  metadata?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
  /** Number of times this job has been re-queued after dead-lettering (tracked by the processor). */
  dlqRetryCount?: number;
}

/**
 * Payment processor that delegates to payment-service API.
 * The actual payment provider integrations (Paystack/Flutterwave) live in
 * payment-service. This processor only enqueues and monitors jobs.
 */
@Processor('payments')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);
  private static readonly DEFAULT_MAX_RETRIES = 5;
  // queue_concurrency_payments: worker concurrency when the flag has no value
  // (or is disabled); ops can raise/lower it at runtime via the flag's value.
  private static readonly DEFAULT_CONCURRENCY = 5;
  // Fallbacks for the DLQ retry policy when the numeric flags carry no value
  // (or an invalid one). Ops can tune both at runtime via
  // queue_dlq_retry_max_passes and queue_dlq_retry_base_delay_ms.
  private static readonly DEFAULT_DLQ_MAX_RETRIES = 3;
  private static readonly DEFAULT_DLQ_RETRY_BASE_DELAY_MS = 30_000;
  // Safety cap for a single DLQ delay — prevents pathological requeue loops
  // regardless of how high ops tunes the base delay.
  private static readonly DLQ_RETRY_MAX_DELAY_MS = 3_600_000;
  private readonly paymentServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly metricsService: MetricsService,
    @InjectQueue('payments') private readonly paymentsQueue: Queue
  ) {
    super();
    this.paymentServiceUrl = this.configService.get<string>(
      'PAYMENT_SERVICE_URL',
      'http://payment-service:3003'
    );
  }

  /**
   * Applies the queue_concurrency_payments flag to the live BullMQ worker.
   * Called on startup and re-applied on every job so ops can tune concurrency
   * at runtime without a restart (changes propagate within the flag cache TTL).
   */
  async onModuleInit(): Promise<void> {
    await this.applyRuntimeConcurrency();
  }

  private async applyRuntimeConcurrency(): Promise<void> {
    // The BullMQ worker only exists after Nest wires the processor; direct
    // instantiations in unit tests have none, so skip silently.
    const worker = this.workerOrNull();
    if (!worker) return;

    const value = await this.featureFlagService.getValue(queueFlags.concurrencyPayments);
    const concurrency =
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(1, Math.floor(value))
        : PaymentProcessor.DEFAULT_CONCURRENCY;

    if (worker.concurrency !== concurrency) {
      worker.concurrency = concurrency;
      this.logger.log(`Payment worker concurrency set to ${concurrency}`);
    }
  }

  private workerOrNull(): Worker | null {
    try {
      return this.worker;
    } catch {
      return null;
    }
  }

  async process(job: Job<PaymentJobData>): Promise<void> {
    // Kill-switch: pause the payment worker by dropping jobs (no money moves).
    if (!(await this.featureFlagService.isEnabled(queueFlags.processPayments))) {
      this.logger.warn(`Payment processing disabled by flag; dropping job ${job.id}`);
      return;
    }

    // Re-tune concurrency from the flag on each job so runtime changes stick.
    await this.applyRuntimeConcurrency();

    this.logger.log(`Processing payment job ${job.id} (attempt ${job.attemptsMade + 1})`);

    const { transactionId, userId, amount, currency, provider, type, metadata } = job.data;

    try {
      switch (type) {
        case 'charge':
          await this.processCharge(transactionId, userId, amount, currency, provider, metadata);
          break;
        case 'refund':
          await this.processRefund(transactionId, userId, amount, currency, provider, metadata);
          break;
        case 'payout':
          await this.processPayout(transactionId, userId, amount, currency, provider, metadata);
          break;
        default:
          this.logger.warn(`Unknown payment type: ${type}`);
          throw new Error(`Unknown payment type: ${type}`);
      }

      this.logger.log(`Payment processed: ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process payment (attempt ${job.attemptsMade + 1}/${PaymentProcessor.DEFAULT_MAX_RETRIES}): ${(error as Error).message}`,
        { jobId: job.id, transactionId, userId, type, provider }
      );
      throw error;
    }
  }

  private async processCharge(
    transactionId: string,
    userId: string,
    amount: number,
    currency: string,
    provider: string,
    _metadata?: Record<string, string>
  ): Promise<void> {
    this.logger.debug(`Processing charge ${transactionId} for ${userId}: ${amount} ${currency}`);
    await axios.post(
      `${this.paymentServiceUrl}/payments/verify`,
      { transactionId, userId, provider },
      { timeout: 15000 }
    );
  }

  private async processRefund(
    transactionId: string,
    userId: string,
    amount: number,
    currency: string,
    provider: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    this.logger.debug(`Processing refund ${transactionId} for ${userId}: ${amount} ${currency}`);
    const reason = metadata?.reason || 'Refund requested';
    await axios.post(
      `${this.paymentServiceUrl}/payments/refund`,
      { transactionId, userId, reason, provider },
      { timeout: 15000 }
    );
  }

  private async processPayout(
    transactionId: string,
    userId: string,
    amount: number,
    currency: string,
    provider: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    this.logger.debug(`Processing payout ${transactionId} for ${userId}: ${amount} ${currency}`);
    const recipient = metadata?.recipient || userId;
    await axios.post(
      `${this.paymentServiceUrl}/payments/payout`,
      { transactionId, userId, amount, recipient, provider },
      { timeout: 30000 }
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Payment job ${job.id} is now active and processing`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Payment job ${job.id} completed successfully (attempts: ${job.attemptsMade + 1})`
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<PaymentJobData>, error: Error) {
    this.logger.error(
      `Payment job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${(error as Error).message}`,
      {
        jobId: job.id,
        transactionId: job.data.transactionId,
        error: (error as Error).message,
        attemptsMade: job.attemptsMade,
      }
    );

    // Dead-letter retry: the 'failed' event fires on every attempt, but only
    // when the attempts budget is exhausted is the job truly dead-lettered.
    const maxAttempts = job.opts.attempts ?? PaymentProcessor.DEFAULT_MAX_RETRIES;
    if (job.attemptsMade >= maxAttempts) {
      await this.maybeDeadLetterRetry(job);
    }
  }

  /**
   * Re-queues a dead-lettered payment job when queue_dlq_retry is enabled,
   * up to MAX_DLQ_RETRIES passes, each with a real delay. BullMQ cannot
   * delay-retry an existing failed job (moveToDelayed requires the active
   * set; re-adding the same jobId is a silent no-op), so we remove the job
   * and re-add it with the same jobId and a delay: a fresh attempts budget
   * (equivalent to resetAttemptsMade) with exponential delay across passes
   * (30s → 60s → 120s). When the flag is disabled (or the budget is
   * exhausted) the job stays in the failed set for manual retry via the
   * queue admin endpoints.
   */
  private async maybeDeadLetterRetry(job: Job<PaymentJobData>): Promise<void> {
    try {
      if (!(await this.dlqRetryEnabled())) {
        this.logger.warn(
          `Payment job ${job.id} dead-lettered (dlq retry disabled); leaving in failed set`
        );
        return;
      }

      // Runtime-tunable policy (queue_dlq_retry_max_passes + base delay): read
      // fresh on every final failure so ops changes apply within the flag
      // cache TTL. Flag value wins over the enqueuer's per-job retryDelay;
      // both fall back to the constants.
      const [maxRetries, baseDelayMs] = await Promise.all([
        this.dlqMaxRetries(),
        this.dlqBaseDelayMs(job.data.retryDelay),
      ]);

      const dlqCount = job.data.dlqRetryCount ?? 0;
      if (dlqCount >= maxRetries) {
        this.logger.error(
          `Payment job ${job.id} permanently dead-lettered after ${dlqCount} DLQ retries (max ${maxRetries})`
        );
        return;
      }

      const nextPass = dlqCount + 1;
      const updatedData: PaymentJobData = { ...job.data, dlqRetryCount: nextPass };
      const delay = this.dlqRetryDelay(nextPass, baseDelayMs);

      // Persist the pass count before mutating the job so an interruption
      // mid-retry never resets the budget.
      await job.updateData(updatedData);
      await job.remove();
      await this.paymentsQueue.add('payments', updatedData, {
        jobId: job.id,
        delay,
        attempts: job.opts.attempts,
        backoff: job.opts.backoff,
      });

      // Job-level metric: one counter increment per DLQ pass actually
      // scheduled, labeled with the queue, pass number, and the effective
      // base delay — feeds retry-latency dashboards (rate * delay ≈ retry
      // backpressure) and shows runtime tuning changes in the flag.
      this.metricsService.incrementDlqRetryScheduled('payments', nextPass, baseDelayMs);

      this.logger.warn(
        `Payment job ${job.id} dead-letter retry #${nextPass}/${maxRetries} scheduled in ${delay}ms`
      );
    } catch (retryError) {
      // Never let DLQ bookkeeping crash the worker. If the delayed re-add
      // fails, fall back to an immediate in-place retry so the job is not
      // lost; ops can still tune the flag or retry manually.
      this.logger.error(
        `Failed to schedule delayed DLQ retry for payment job ${job.id}: ${(retryError as Error).message}`
      );
      try {
        await job.retry('failed', { resetAttemptsMade: true });
      } catch (fallbackError) {
        this.logger.error(
          `Fallback retry for payment job ${job.id} also failed: ${(fallbackError as Error).message}`
        );
      }
    }
  }

  /**
   * Dead-letter retry toggle for payments. The per-queue flag
   * (queue_dlq_retry_payments), when explicitly stored, overrides the shared
   * queue_dlq_retry — so ops can pause or resume DLQ retry for payments
   * independently of the other queues. Unset per-queue flags follow the
   * shared switch. Stored-ness is checked via getFlag (not isEnabled) because
   * the admin UI lists the per-queue toggle as default-on.
   */
  private async dlqRetryEnabled(): Promise<boolean> {
    const perQueue = await this.featureFlagService.getFlag(queueFlags.dlqRetryPayments);
    if (perQueue) {
      return this.featureFlagService.isEnabled(queueFlags.dlqRetryPayments);
    }
    return this.featureFlagService.isEnabled(queueFlags.dlqRetry);
  }

  /** Max DLQ passes for payments: the per-queue flag
   * (queue_dlq_retry_max_passes_payments) when stored, else the shared
   * queue_dlq_retry_max_passes, else the fallback constant (positive
   * integer). */
  private async dlqMaxRetries(): Promise<number> {
    const perQueue = await this.featureFlagService.getFlag(
      queueFlags.dlqRetryMaxPassesPayments
    );
    const value = perQueue
      ? await this.featureFlagService.getValue(queueFlags.dlqRetryMaxPassesPayments)
      : await this.featureFlagService.getValue(queueFlags.dlqRetryMaxPasses);
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
      return Math.floor(value);
    }
    return PaymentProcessor.DEFAULT_DLQ_MAX_RETRIES;
  }

  /** Base DLQ delay in ms for payments: the per-queue flag
   * (queue_dlq_retry_base_delay_ms_payments) when stored, else the shared
   * queue_dlq_retry_base_delay_ms, else the enqueuer's per-job retryDelay,
   * then the constant (positive number). */
  private async dlqBaseDelayMs(jobBaseMs?: number): Promise<number> {
    const perQueue = await this.featureFlagService.getFlag(
      queueFlags.dlqRetryBaseDelayMsPayments
    );
    const value = perQueue
      ? await this.featureFlagService.getValue(queueFlags.dlqRetryBaseDelayMsPayments)
      : await this.featureFlagService.getValue(queueFlags.dlqRetryBaseDelayMs);
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof jobBaseMs === 'number' && Number.isFinite(jobBaseMs) && jobBaseMs > 0) {
      return jobBaseMs;
    }
    return PaymentProcessor.DEFAULT_DLQ_RETRY_BASE_DELAY_MS;
  }

  /** Exponential DLQ delay: base doubles per pass, capped to avoid
   * pathological requeue loops. */
  private dlqRetryDelay(pass: number, baseMs: number): number {
    return Math.min(baseMs * 2 ** (pass - 1), PaymentProcessor.DLQ_RETRY_MAX_DELAY_MS);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(`Payment job ${job.id} has stalled - it might need to be reprocessed`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.debug(`Payment job ${job.id} progress: ${JSON.stringify(progress)}`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log('All payment jobs have been processed, worker is idle');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Payment worker encountered an error: ${(error as Error).message}`, {
      stack: (error as Error).stack,
    });
  }
}

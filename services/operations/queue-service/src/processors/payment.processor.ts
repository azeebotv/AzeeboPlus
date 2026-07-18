import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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
  private readonly paymentServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.paymentServiceUrl = this.configService.get<string>(
      'PAYMENT_SERVICE_URL',
      'http://payment-service:3003'
    );
  }

  async process(job: Job<PaymentJobData>): Promise<void> {
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
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Payment job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${(error as Error).message}`,
      {
        jobId: job.id,
        transactionId: job.data.transactionId,
        error: (error as Error).message,
        attemptsMade: job.attemptsMade,
      }
    );
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

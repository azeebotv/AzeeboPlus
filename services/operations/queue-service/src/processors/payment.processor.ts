import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PaystackProvider, FlutterwaveProvider } from '../modules/payments/providers';

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

@Processor('payments')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);
  private static readonly DEFAULT_MAX_RETRIES = 5;

  constructor(
    private readonly paystackProvider: PaystackProvider,
    private readonly flutterwaveProvider: FlutterwaveProvider
  ) {
    super();
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
    const paymentProvider =
      provider === 'paystack' ? this.paystackProvider : this.flutterwaveProvider;
    // For charge, we typically just verify the payment
    await paymentProvider.verifyPayment(transactionId);
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
    const paymentProvider =
      provider === 'paystack' ? this.paystackProvider : this.flutterwaveProvider;
    const reason = metadata?.reason || 'Refund requested';
    await paymentProvider.processRefund(transactionId, reason);
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
    const paymentProvider =
      provider === 'paystack' ? this.paystackProvider : this.flutterwaveProvider;
    const recipient = metadata?.recipient || userId;
    await paymentProvider.processPayout(amount, recipient, transactionId);
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

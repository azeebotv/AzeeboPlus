import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../modules/email/email.service';
import { FirebaseService } from '../modules/firebase/firebase.service';
import { SmsService } from '../modules/sms/sms.service';

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
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_RETRY_DELAY = 5000; // 5 seconds
  private static readonly BACKOFF_MULTIPLIER = 2;

  constructor(
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
    private readonly smsService: SmsService
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} (attempt ${job.attemptsMade + 1})`);

    this.currentJobData = job.data;
    const { userId, type, title, message, data } = job.data;

    try {
      switch (type) {
        case 'push':
          await this.sendPushNotification(userId, title, message, data);
          break;
        case 'email':
          await this.sendEmail(userId, title, message, data);
          break;
        case 'sms':
          await this.sendSms(userId, message, data);
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

  private async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, string>
  ): Promise<void> {
    this.logger.info(`Sending push notification to ${userId}: ${title}`);
    const pushTokens = this.currentJobData?.pushTokens ?? [];
    for (const token of pushTokens) {
      await this.firebaseService.sendPushNotification(token, title, message, data);
    }
  }

  private async sendEmail(
    userId: string,
    subject: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    this.logger.info(`Sending email to ${userId}: ${subject}`);
    const email = this.currentJobData?.email;
    if (email) {
      await this.emailService.sendCustomEmail(email, subject, `<p>${body}</p>`);
    } else {
      this.logger.warn(`No email address in payload for user ${userId}; skipping email`);
    }
  }

  private async sendSms(
    userId: string,
    message: string,
    data?: Record<string, string>
  ): Promise<void> {
    this.logger.info(`Sending SMS to ${userId}`);
    const phone = this.currentJobData?.phone;
    if (phone) {
      await this.smsService.sendSms(phone, message);
    } else {
      this.logger.warn(`No phone number in payload for user ${userId}; skipping SMS`);
    }
  }

  // Holds the current job's payload so private helpers can access contact info
  // without querying another service's canonical data.
  private currentJobData: NotificationJobData | null = null;

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.info(`Job ${job.id} is now active and processing`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully (attempts: ${job.attemptsMade + 1})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${error.message}`,
      { jobId: job.id, error: error.stack, attemptsMade: job.attemptsMade }
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(`Job ${job.id} has stalled - it might need to be reprocessed`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.info(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log('All jobs have been processed, worker is idle');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker encountered an error: ${error.message}`, { stack: error.stack });
  }
}

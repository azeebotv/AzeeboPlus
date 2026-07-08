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

    const { userId, type, title, message, data } = job.data;

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
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${error.message}`,
      { jobId: job.id, error: error.message, attemptsMade: job.attemptsMade }
    );
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
    this.logger.error(`Worker encountered an error: ${error.message}`, { stack: error.message });
  }
}

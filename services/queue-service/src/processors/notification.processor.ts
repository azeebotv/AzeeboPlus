import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../modules/database/prisma.service';
import { EmailService } from '../modules/email/email.service';
import { FirebaseService } from '../modules/firebase/firebase.service';
import { SmsService } from '../modules/sms/sms.service';

export interface NotificationJobData {
  userId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  message: string;
  data?: Record<string, string>;
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
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
    private readonly smsService: SmsService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} (attempt ${job.attemptsMade + 1})`);

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
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.debug(`Sending push notification to ${userId}: ${title}`);
    const pushTokens = await this.prismaService.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    for (const { token } of pushTokens) {
      await this.firebaseService.sendPushNotification(token, title, message, data);
    }
  }

  private async sendEmail(
    userId: string,
    subject: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.debug(`Sending email to ${userId}: ${subject}`);
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });
    if (user?.email) {
      await this.emailService.sendCustomEmail(user.email, subject, `<p>${body}</p>`);
    }
  }

  private async sendSms(
    userId: string,
    message: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.debug(`Sending SMS to ${userId}`);
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (user?.phone) {
      await this.smsService.sendSms(user.phone, message);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} is now active and processing`);
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
    this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
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

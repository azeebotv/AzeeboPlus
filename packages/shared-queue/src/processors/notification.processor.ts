import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

export interface NotificationJobData {
  userId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  message: string;
  data?: Record<string, string>;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id}`);

    const { userId, type, title } = job.data;

    switch (type) {
      case 'push':
        await this.sendPushNotification(userId, title);
        break;
      case 'email':
        await this.sendEmail(userId, title);
        break;
      case 'sms':
        await this.sendSms(userId);
        break;
      default:
        this.logger.warn(`Unknown notification type: ${type}`);
    }

    this.logger.log(`Notification sent to user ${userId}: ${title}`);
  }

  private async sendPushNotification(userId: string, title: string): Promise<void> {
    this.logger.debug(`Sending push notification to ${userId}: ${title}`);
  }

  private async sendEmail(userId: string, subject: string): Promise<void> {
    this.logger.debug(`Sending email to ${userId}: ${subject}`);
  }

  private async sendSms(userId: string): Promise<void> {
    this.logger.debug(`Sending SMS to ${userId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}

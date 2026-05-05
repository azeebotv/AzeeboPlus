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

    const { userId, type, title, message, data } = job.data;

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
    }

    this.logger.log(`Notification sent to user ${userId}: ${title}`);
  }

  private async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.debug(`Sending push notification to ${userId}: ${title}`);
  }

  private async sendEmail(
    userId: string,
    subject: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.debug(`Sending email to ${userId}: ${subject}`);
  }

  private async sendSms(
    userId: string,
    message: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.debug(`Sending SMS to ${userId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '@azeebo/shared-services';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
}

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private static readonly DEFAULT_MAX_RETRIES = 3;

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} (attempt ${job.attemptsMade + 1})`);

    const { to, subject, template, context } = job.data;

    try {
      await this.sendEmail(to, subject, template, context);
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email (attempt ${job.attemptsMade + 1}/${EmailProcessor.DEFAULT_MAX_RETRIES}): ${(error as Error).message}`,
        { jobId: job.id, to, subject, template }
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
    this.logger.log(`Sending email to ${to} using template ${template}`);
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
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Email job ${job.id} failed after ${job.attemptsMade + 1} attempts: ${(error as Error).message}`,
      {
        jobId: job.id,
        to: job.data.to,
        error: (error as Error).message,
        attemptsMade: job.attemptsMade,
      }
    );
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

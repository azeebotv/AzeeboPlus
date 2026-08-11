import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job, JobType } from 'bullmq';

const QUEUE_NAMES = [
  'notifications',
  'payments',
  'emails',
  'analytics',
  'content-processing',
] as const;
export type QueueName = (typeof QUEUE_NAMES)[number];

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('payments') private readonly paymentsQueue: Queue,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
    @InjectQueue('content-processing') private readonly contentProcessingQueue: Queue
  ) {}

  private getQueue(name: QueueName): Queue {
    const queues: Record<QueueName, Queue> = {
      notifications: this.notificationsQueue,
      payments: this.paymentsQueue,
      emails: this.emailsQueue,
      analytics: this.analyticsQueue,
      'content-processing': this.contentProcessingQueue,
    };
    return queues[name];
  }

  async getQueueStats(): Promise<
    Array<{
      name: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: number;
    }>
  > {
    try {
      const stats = await Promise.all(
        QUEUE_NAMES.map(async (name) => {
          const queue = this.getQueue(name);
          const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
            queue.isPaused().then((p) => (p ? 1 : 0)),
          ]);
          return { name, waiting, active, completed, failed, delayed, paused };
        })
      );
      return stats;
    } catch (error) {
      this.logger.error('Failed to get queue stats', (error as Error).stack);
      throw error;
    }
  }

  async getJobs(queueName: QueueName, types: JobType[], start = 0, end = 50): Promise<Job[]> {
    try {
      const queue = this.getQueue(queueName);
      return await queue.getJobs(types, start, end);
    } catch (error) {
      this.logger.error(`Failed to get jobs from queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async getJobById(queueName: QueueName, jobId: string): Promise<Job | null> {
    try {
      const queue = this.getQueue(queueName);
      return (await queue.getJob(jobId)) ?? null;
    } catch (error) {
      this.logger.error(`Failed to get job ${jobId} from queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`);
      }
      await job.retry();
      this.logger.log(`Retried job ${jobId} in queue ${queueName}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to retry job ${jobId} in queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  /** Re-queue a permanently dead-lettered job with a fresh attempts budget.
   * Plain `retryJob` keeps `attemptsMade`, so a job whose attempts are
   * exhausted (the dead-letter condition) would immediately fail again — this
   * instead resets `attemptsMade` (via `resetAttemptsMade`) and clears the
   * DLQ pass counter in the job data, giving the job a full new lifecycle:
   * a fresh attempts budget AND a fresh dead-letter retry budget, so the next
   * failure flows through the DLQ machinery again instead of instantly
   * re-dead-lettering. Only failed jobs are accepted. */
  async retryDeadLettered(queueName: QueueName, jobId: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`);
      }
      if ((await job.getState()) !== 'failed') {
        throw new BadRequestException(
          `Job ${jobId} in queue ${queueName} is not in the failed state — retry-now is for dead-lettered jobs`
        );
      }

      // Persist the DLQ budget reset before re-queueing so an interruption
      // mid-retry never leaves a stale pass counter on a fresh job.
      const data = job.data as { dlqRetryCount?: number };
      if (data && data.dlqRetryCount !== undefined && data.dlqRetryCount !== 0) {
        await job.updateData({ ...data, dlqRetryCount: 0 });
      }
      await job.retry('failed', { resetAttemptsMade: true });
      this.logger.log(
        `Retried dead-lettered job ${jobId} in queue ${queueName} with a fresh attempts budget`
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to retry-now job ${jobId} in queue ${queueName}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async retryAllFailed(queueName: QueueName): Promise<number> {
    try {
      const queue = this.getQueue(queueName);
      const failedJobs = await queue.getFailed();
      let retried = 0;
      for (const job of failedJobs) {
        await job.retry();
        retried++;
      }
      this.logger.log(`Retried ${retried} failed jobs in queue ${queueName}`);
      return retried;
    } catch (error) {
      this.logger.error(`Failed to retry all failed jobs in queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`);
      }
      await job.remove();
      this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to remove job ${jobId} from queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async pauseQueue(queueName: QueueName): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.pause();
      this.logger.log(`Paused queue ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to pause queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.resume();
      this.logger.log(`Resumed queue ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to resume queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async getFailedJobs(queueName: QueueName, start = 0, end = 50): Promise<Job[]> {
    try {
      const queue = this.getQueue(queueName);
      return await queue.getFailed(start, end);
    } catch (error) {
      this.logger.error(`Failed to get failed jobs from queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async getDelayedJobs(queueName: QueueName, start = 0, end = 50): Promise<Job[]> {
    try {
      const queue = this.getQueue(queueName);
      return await queue.getDelayed(start, end);
    } catch (error) {
      this.logger.error(`Failed to get delayed jobs from queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  async cleanQueue(queueName: QueueName, grace: number, limit?: number): Promise<string[]> {
    try {
      const queue = this.getQueue(queueName);
      const cleaned = await queue.clean(grace, limit ?? 1000);
      this.logger.log(`Cleaned ${cleaned.length} jobs from queue ${queueName}`);
      return cleaned;
    } catch (error) {
      this.logger.error(`Failed to clean queue ${queueName}`, (error as Error).stack);
      throw error;
    }
  }

  isQueueName(name: string): name is QueueName {
    return QUEUE_NAMES.includes(name as QueueName);
  }
}

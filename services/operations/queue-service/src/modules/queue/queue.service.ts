import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  }

  async getJobs(queueName: QueueName, types: JobType[], start = 0, end = 50): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getJobs(types, start, end);
  }

  async getJobById(queueName: QueueName, jobId: string): Promise<Job | null> {
    const queue = this.getQueue(queueName);
    return (await queue.getJob(jobId)) ?? null;
  }

  async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`);
    }
    await job.retry();
    this.logger.log(`Retried job ${jobId} in queue ${queueName}`);
  }

  async retryAllFailed(queueName: QueueName): Promise<number> {
    const queue = this.getQueue(queueName);
    const failedJobs = await queue.getFailed();
    let retried = 0;
    for (const job of failedJobs) {
      await job.retry();
      retried++;
    }
    this.logger.log(`Retried ${retried} failed jobs in queue ${queueName}`);
    return retried;
  }

  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`);
    }
    await job.remove();
    this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
  }

  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Paused queue ${queueName}`);
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Resumed queue ${queueName}`);
  }

  async getFailedJobs(queueName: QueueName, start = 0, end = 50): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getFailed(start, end);
  }

  async getDelayedJobs(queueName: QueueName, start = 0, end = 50): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return queue.getDelayed(start, end);
  }

  async cleanQueue(queueName: QueueName, grace: number, limit?: number): Promise<string[]> {
    const queue = this.getQueue(queueName);
    const cleaned = await queue.clean(grace, limit ?? 1000);
    this.logger.log(`Cleaned ${cleaned.length} jobs from queue ${queueName}`);
    return cleaned;
  }

  isQueueName(name: string): name is QueueName {
    return QUEUE_NAMES.includes(name as QueueName);
  }
}

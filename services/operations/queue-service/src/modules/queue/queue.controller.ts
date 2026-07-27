import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from '@nestjs/common';
import { QueueService, QueueName } from './queue.service';
import { AdminGuard } from '@azeebo/security';
import type { JobType } from 'bullmq';

@Controller('queue')
@UseGuards(AdminGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  async getStats() {
    return this.queueService.getQueueStats();
  }

  @Get(':queue/jobs')
  async getJobs(
    @Param('queue') queue: string,
    @Query('type') type?: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    this.assertValidQueue(queue);
    const validQueue = queue as
      | 'notifications'
      | 'payments'
      | 'emails'
      | 'analytics'
      | 'content-processing';
    const types = (type || 'waiting,active,failed,delayed').split(',') as JobType[];
    const s = parseInt(start || '0', 10);
    const e = parseInt(end || '50', 10);
    return this.queueService.getJobs(validQueue, types, s, e);
  }

  @Get(':queue/jobs/failed')
  async getFailedJobs(
    @Param('queue') queue: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    this.assertValidQueue(queue);
    const s = parseInt(start || '0', 10);
    const e = parseInt(end || '50', 10);
    return this.queueService.getFailedJobs(queue as QueueName, s, e);
  }

  @Get(':queue/jobs/delayed')
  async getDelayedJobs(
    @Param('queue') queue: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    this.assertValidQueue(queue);
    const s = parseInt(start || '0', 10);
    const e = parseInt(end || '50', 10);
    return this.queueService.getDelayedJobs(queue as QueueName, s, e);
  }

  @Get(':queue/jobs/:jobId')
  async getJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    this.assertValidQueue(queue);
    const job = await this.queueService.getJobById(queue as QueueName, jobId);
    if (!job) {
      return { error: 'Job not found' };
    }
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  @Post(':queue/jobs/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    this.assertValidQueue(queue);
    await this.queueService.retryJob(queue as QueueName, jobId);
    return { success: true, message: `Job ${jobId} retried` };
  }

  @Post(':queue/retry-all-failed')
  @HttpCode(HttpStatus.OK)
  async retryAllFailed(@Param('queue') queue: string) {
    this.assertValidQueue(queue);
    const count = await this.queueService.retryAllFailed(queue as QueueName);
    return { success: true, retried: count };
  }

  @Delete(':queue/jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  async removeJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    this.assertValidQueue(queue);
    await this.queueService.removeJob(queue as QueueName, jobId);
    return { success: true, message: `Job ${jobId} removed` };
  }

  @Post(':queue/pause')
  @HttpCode(HttpStatus.OK)
  async pauseQueue(@Param('queue') queue: string) {
    this.assertValidQueue(queue);
    await this.queueService.pauseQueue(queue as QueueName);
    return { success: true, message: `Queue ${queue} paused` };
  }

  @Post(':queue/resume')
  @HttpCode(HttpStatus.OK)
  async resumeQueue(@Param('queue') queue: string) {
    this.assertValidQueue(queue);
    await this.queueService.resumeQueue(queue as QueueName);
    return { success: true, message: `Queue ${queue} resumed` };
  }

  @Post(':queue/clean')
  @HttpCode(HttpStatus.OK)
  async cleanQueue(
    @Param('queue') queue: string,
    @Body() body: { grace?: number; limit?: number }
  ) {
    this.assertValidQueue(queue);
    const grace = body.grace ?? 3600000; // default 1 hour
    const limit = body.limit;
    const cleaned = await this.queueService.cleanQueue(queue as QueueName, grace, limit);
    return { success: true, cleaned: cleaned.length };
  }

  private assertValidQueue(name: string): void {
    if (!this.queueService.isQueueName(name)) {
      throw new Error(
        `Invalid queue: ${name}. Valid queues: notifications, payments, emails, analytics, content-processing`
      );
    }
  }
}

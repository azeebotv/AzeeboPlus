import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueueService } from './queue.service';
import type { Queue } from 'bullmq';

describe('QueueService.retryDeadLettered', () => {
  let service: QueueService;
  let queue: { getJob: jest.Mock };
  let job: {
    getState: jest.Mock;
    retry: jest.Mock;
    updateData: jest.Mock;
    data: { dlqRetryCount?: number };
  };

  const mockQueues = () => ({
    notifications: { getJob: jest.fn() },
    payments: { getJob: jest.fn() },
    emails: { getJob: jest.fn() },
    analytics: { getJob: jest.fn() },
    'content-processing': { getJob: jest.fn() },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const queues = mockQueues();
    service = new QueueService(
      queues.notifications as unknown as Queue,
      queues.payments as unknown as Queue,
      queues.emails as unknown as Queue,
      queues.analytics as unknown as Queue,
      queues['content-processing'] as unknown as Queue
    );
    queue = queues.payments;
    job = {
      getState: jest.fn().mockResolvedValue('failed'),
      retry: jest.fn().mockResolvedValue(undefined),
      updateData: jest.fn().mockResolvedValue(undefined),
      data: { dlqRetryCount: 2 },
    };
    queue.getJob.mockResolvedValue(job);
  });

  it('re-queues a dead-lettered job with a fresh attempts budget and reset DLQ pass counter', async () => {
    await service.retryDeadLettered('payments', 'job-1');

    expect(queue.getJob).toHaveBeenCalledWith('job-1');
    // DLQ pass counter cleared first (persisted before the re-queue), then
    // attemptsMade reset so the job gets its full attempts budget back.
    expect(job.updateData).toHaveBeenCalledWith({ dlqRetryCount: 0 });
    expect(job.retry).toHaveBeenCalledWith('failed', { resetAttemptsMade: true });
  });

  it('skips the data update when the job has no DLQ pass counter', async () => {
    job.data = {};

    await service.retryDeadLettered('payments', 'job-2');

    expect(job.updateData).not.toHaveBeenCalled();
    expect(job.retry).toHaveBeenCalledWith('failed', { resetAttemptsMade: true });
  });

  it('leaves a zero DLQ counter untouched', async () => {
    job.data = { dlqRetryCount: 0 };

    await service.retryDeadLettered('payments', 'job-3');

    expect(job.updateData).not.toHaveBeenCalled();
    expect(job.retry).toHaveBeenCalled();
  });

  it('throws NotFoundException when the job does not exist', async () => {
    queue.getJob.mockResolvedValue(null);

    await expect(service.retryDeadLettered('payments', 'missing')).rejects.toThrow(
      NotFoundException
    );
    expect(job.retry).not.toHaveBeenCalled();
  });

  it('rejects jobs that are not in the failed state', async () => {
    job.getState.mockResolvedValue('active');

    await expect(service.retryDeadLettered('payments', 'job-4')).rejects.toThrow(
      BadRequestException
    );
    expect(job.retry).not.toHaveBeenCalled();
  });

  it('propagates retry failures after logging', async () => {
    job.retry.mockRejectedValue(new Error('redis unavailable'));

    await expect(service.retryDeadLettered('payments', 'job-5')).rejects.toThrow(
      'redis unavailable'
    );
  });
});

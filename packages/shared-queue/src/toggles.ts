import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES, QueueName } from './types/queue.types';

/** Canonical per-queue feature-flag key, e.g. `queue_process_notifications`. */
export const queueProcessFlagKey = (queue: string): string =>
  `queue_process_${queue.replace(/[^a-z0-9_-]/gi, '').replace(/[^a-z0-9]/g, '_')}`;

/** Maps every registered queue to its `queue_process_*` flag key. */
export const QUEUE_PROCESS_FLAG_KEYS: Record<QueueName, string> = {
  [QUEUE_NAMES.NOTIFICATIONS]: queueProcessFlagKey(QUEUE_NAMES.NOTIFICATIONS),
  [QUEUE_NAMES.PAYMENTS]: queueProcessFlagKey(QUEUE_NAMES.PAYMENTS),
  [QUEUE_NAMES.EMAILS]: queueProcessFlagKey(QUEUE_NAMES.EMAILS),
  [QUEUE_NAMES.ANALYTICS]: queueProcessFlagKey(QUEUE_NAMES.ANALYTICS),
  [QUEUE_NAMES.CONTENT_PROCESSING]: queueProcessFlagKey(QUEUE_NAMES.CONTENT_PROCESSING),
};

export type QueueToggleResolver = (queueName: string) => Promise<boolean>;

/**
 * Base class for workers that can be toggled off centrally via the
 * `queue_process_*` feature flags (registered on `queueFlags` in
 * `@azeebo/feature-flags`).
 *
 * Subclasses supply a `resolver` (typically backed by FeatureFlagService) in
 * their constructor; when the resolver returns false the job is acknowledged
 * without running the payload handler, so a flipped flag drains the queue
 * without loss or reprocessing. The default resolver keeps everything enabled
 * so existing (non-wired) processors behave unchanged.
 */
export abstract class ToggleAwareProcessor extends WorkerHost {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly resolver: QueueToggleResolver;

  protected constructor(resolver?: QueueToggleResolver) {
    super();
    this.resolver = resolver ?? (async () => true);
  }

  /** Whether consumption is currently enabled for the given queue name. */
  protected async isQueueEnabled(queueName: string): Promise<boolean> {
    return this.resolver(queueName);
  }

  /** Runs the real payload handler when the queue toggle is enabled. */
  protected abstract processEnabled(job: Job): Promise<void>;
}

/**
 * Concrete wiring helper for processors declared with `@Processor`:
 * wraps a processor's `process` implementation so the `queue_process_*` toggle
 * is checked first, and skipped jobs are logged + acknowledged.
 */
export function withQueueToggle(
  processor: WorkerHost & { process: (job: Job) => Promise<void> },
  resolver: QueueToggleResolver
): void {
  const originalProcess = processor.process.bind(processor);
  processor.process = async (job: Job) => {
    const queueName = job.queueName ?? job.name ?? 'unknown';
    if (!(await resolver(queueName))) {
      new Logger('QueueToggle').warn(
        `Skipping job ${job.id}: processing disabled for queue '${queueName}'`
      );
      return;
    }
    await originalProcess(job);
  };
}

export { WorkerHost, Processor };

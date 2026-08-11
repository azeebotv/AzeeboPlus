import {
  queueProcessFlagKey,
  QUEUE_PROCESS_FLAG_KEYS,
  withQueueToggle,
  QUEUE_NAMES,
} from './index';

describe('queue process toggles', () => {
  it('maps queue names to canonical queue_process_* flag keys', () => {
    expect(queueProcessFlagKey('notifications')).toBe('queue_process_notifications');
    expect(queueProcessFlagKey('payments')).toBe('queue_process_payments');
    expect(queueProcessFlagKey('content-processing')).toBe('queue_process_content_processing');
  });

  it('covers every registered queue name', () => {
    for (const name of Object.values(QUEUE_NAMES)) {
      expect(QUEUE_PROCESS_FLAG_KEYS[name]).toMatch(/^queue_process_/);
    }
  });

  it('skips the payload when the resolver returns false', async () => {
    const process = jest.fn(async () => undefined);
    const processor = { process } as unknown as {
      process: (job: { queueName: string }) => Promise<void>;
    };
    withQueueToggle(processor as never, async () => false);

    await processor.process({ queueName: 'notifications' });
    expect(process).not.toHaveBeenCalled();
  });

  it('runs the payload when the resolver returns true', async () => {
    const process = jest.fn(async () => undefined);
    const processor = { process } as unknown as {
      process: (job: { queueName: string }) => Promise<void>;
    };
    withQueueToggle(processor as never, async (queueName: string) => queueName === 'payments');

    await processor.process({ queueName: 'payments' });
    expect(process).toHaveBeenCalledTimes(1);
    await processor.process({ queueName: 'notifications' });
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('passes the resolved queue name to the resolver', async () => {
    const resolver = jest.fn(async () => true);
    const process = jest.fn(async () => undefined);
    const processor = { process } as unknown as {
      process: (job: { queueName: string }) => Promise<void>;
    };
    withQueueToggle(processor as never, resolver);

    await processor.process({ queueName: 'emails' });
    expect(resolver).toHaveBeenCalledWith('emails');
  });

  it('pause: jobs drain without reprocessing while the toggle is off', async () => {
    const process = jest.fn(async () => undefined);
    const processor = { process } as unknown as {
      process: (job: { queueName: string; id: string }) => Promise<void>;
    };
    let enabled = true;
    withQueueToggle(processor as never, async () => enabled);

    await processor.process({ queueName: 'payments', id: 'a' });
    expect(process).toHaveBeenCalledTimes(1);

    // Flipped off: three queued jobs are acked without running the payload.
    enabled = false;
    await processor.process({ queueName: 'payments', id: 'b' });
    await processor.process({ queueName: 'payments', id: 'c' });
    await processor.process({ queueName: 'payments', id: 'd' });
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('resume: re-enabling the toggle runs the payload again with no carry-over', async () => {
    const process = jest.fn(async () => undefined);
    const processor = { process } as unknown as {
      process: (job: { queueName: string; id: string }) => Promise<void>;
    };
    let enabled = false;
    withQueueToggle(processor as never, async () => enabled);

    await processor.process({ queueName: 'emails', id: 'paused' });
    expect(process).not.toHaveBeenCalled();

    enabled = true;
    await processor.process({ queueName: 'emails', id: 'resumed' });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith({ queueName: 'emails', id: 'resumed' });
  });

  it('skipped jobs are acknowledged (resolve) so a paused queue drains cleanly', async () => {
    const process = jest.fn(async () => undefined);
    const processor = { process } as unknown as {
      process: (job: { queueName: string; id: string }) => Promise<void>;
    };
    withQueueToggle(processor as never, async () => false);

    // A skip must not throw — BullMQ treats a resolved handler as success.
    await expect(
      processor.process({ queueName: 'analytics', id: 'x' })
    ).resolves.toBeUndefined();
  });
});

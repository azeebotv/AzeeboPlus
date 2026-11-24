import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';
import { resolveDlqPolicy, DLQ_QUEUE_DEFAULTS } from './dlq-policy';

/** A stored flag record as getFlag would return it. */
const stored = (key: string, enabled = true, value?: number) => ({
  key,
  enabled,
  ...(value !== undefined ? { value } : {}),
});

function mockFlags(overrides: {
  getFlag?: jest.Mock;
  isEnabled?: jest.Mock;
  getValue?: jest.Mock;
}) {
  const flags = {
    getFlag: jest.fn().mockResolvedValue(null),
    isEnabled: jest.fn().mockResolvedValue(true),
    getValue: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
  return flags as unknown as FeatureFlagService;
}

describe('resolveDlqPolicy', () => {
  it('reports the default source with registered default values when nothing is stored', async () => {
    // Nothing stored: getValue falls through to the registered defaults.
    const flags = mockFlags({
      getValue: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(
            key === queueFlags.dlqRetryMaxPasses
              ? 3
              : key === queueFlags.dlqRetryBaseDelayMs
                ? 30000
                : null
          )
        ),
    });

    const policy = await resolveDlqPolicy(flags, 'payments');

    expect(policy.toggle).toEqual({
      source: 'default',
      value: true,
      key: queueFlags.dlqRetry,
    });
    expect(policy.maxPasses).toEqual({
      source: 'default',
      value: 3,
      key: queueFlags.dlqRetryMaxPasses,
    });
    expect(policy.baseDelayMs).toEqual({
      source: 'default',
      value: 30000,
      key: queueFlags.dlqRetryBaseDelayMs,
    });
  });

  it('falls back to the queue constant when no default is registered (emails 60s)', async () => {
    const flags = mockFlags({}); // getValue → null, nothing stored

    const policy = await resolveDlqPolicy(flags, 'emails');

    expect(policy.maxPasses).toEqual({
      source: 'default',
      value: DLQ_QUEUE_DEFAULTS.emails.maxPasses,
      key: queueFlags.dlqRetryMaxPasses,
    });
    expect(policy.baseDelayMs).toEqual({
      source: 'default',
      value: 60000,
      key: queueFlags.dlqRetryBaseDelayMs,
    });
  });

  it('per-queue stored flags win for their queue (toggle, budget, delay)', async () => {
    const flags = mockFlags({
      getFlag: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(
            key === queueFlags.dlqRetryPayments
              ? stored(key, false)
              : key === queueFlags.dlqRetryMaxPassesPayments
                ? stored(key, true, 5)
                : key === queueFlags.dlqRetryBaseDelayMsPayments
                  ? stored(key, true, 120000)
                  : null
          )
        ),
      isEnabled: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(key === queueFlags.dlqRetryPayments ? false : true)
        ),
      getValue: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(
            key === queueFlags.dlqRetryMaxPassesPayments
              ? 5
              : key === queueFlags.dlqRetryBaseDelayMsPayments
                ? 120000
                : null
          )
        ),
    });

    const policy = await resolveDlqPolicy(flags, 'payments');

    expect(policy.toggle).toEqual({
      source: 'per-queue',
      value: false,
      key: queueFlags.dlqRetryPayments,
    });
    expect(policy.maxPasses).toEqual({
      source: 'per-queue',
      value: 5,
      key: queueFlags.dlqRetryMaxPassesPayments,
    });
    expect(policy.baseDelayMs).toEqual({
      source: 'per-queue',
      value: 120000,
      key: queueFlags.dlqRetryBaseDelayMsPayments,
    });
  });

  it('uses the shared flag when stored and the per-queue override is not', async () => {
    const flags = mockFlags({
      getFlag: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(
            key === queueFlags.dlqRetry
              ? stored(key, true)
              : key === queueFlags.dlqRetryMaxPasses
                ? stored(key, true, 7)
                : key === queueFlags.dlqRetryBaseDelayMs
                  ? stored(key, true, 90000)
                  : null
          )
        ),
      getValue: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(
            key === queueFlags.dlqRetryMaxPasses
              ? 7
              : key === queueFlags.dlqRetryBaseDelayMs
                ? 90000
                : null
          )
        ),
    });

    const policy = await resolveDlqPolicy(flags, 'notifications');

    expect(policy.toggle).toEqual({ source: 'shared', value: true, key: queueFlags.dlqRetry });
    expect(policy.maxPasses).toEqual({
      source: 'shared',
      value: 7,
      key: queueFlags.dlqRetryMaxPasses,
    });
    expect(policy.baseDelayMs).toEqual({
      source: 'shared',
      value: 90000,
      key: queueFlags.dlqRetryBaseDelayMs,
    });
  });

  it('a per-queue flag stored for one queue does not leak into another queue', async () => {
    const flags = mockFlags({
      getFlag: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(key === queueFlags.dlqRetryMaxPassesEmails ? stored(key, true, 1) : null)
        ),
      getValue: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(key === queueFlags.dlqRetryMaxPassesEmails ? 1 : null)
        ),
    });

    const payments = await resolveDlqPolicy(flags, 'payments');
    const emails = await resolveDlqPolicy(flags, 'emails');

    expect(payments.maxPasses.source).toBe('default'); // untouched by the emails override
    expect(emails.maxPasses).toEqual({
      source: 'per-queue',
      value: 1,
      key: queueFlags.dlqRetryMaxPassesEmails,
    });
  });

  it('floors fractional max passes and validates stored numerics like the processors', async () => {
    const flags = mockFlags({
      getFlag: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(
            key === queueFlags.dlqRetryMaxPassesPayments ? stored(key, true, 2.9) : null
          )
        ),
      getValue: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(key === queueFlags.dlqRetryMaxPassesPayments ? 2.9 : null)
        ),
    });

    const policy = await resolveDlqPolicy(flags, 'payments');

    expect(policy.maxPasses.value).toBe(2);
  });

  it('treats an invalid stored numeric as unset and falls back to the queue default', async () => {
    const flags = mockFlags({
      getFlag: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(key === queueFlags.dlqRetryMaxPassesEmails ? stored(key, true, -1) : null)
        ),
      getValue: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(key === queueFlags.dlqRetryMaxPassesEmails ? -1 : null)
        ),
    });

    const policy = await resolveDlqPolicy(flags, 'emails');

    expect(policy.maxPasses).toEqual({
      source: 'per-queue',
      value: DLQ_QUEUE_DEFAULTS.emails.maxPasses,
      key: queueFlags.dlqRetryMaxPassesEmails,
    });
  });
});

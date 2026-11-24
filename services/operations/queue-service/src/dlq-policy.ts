import { FeatureFlagService, queueFlags } from '@azeebo/feature-flags';

export type DlqQueue = 'payments' | 'notifications' | 'emails';

/** Which flag supplied the resolved value. */
export type FlagSource = 'per-queue' | 'shared' | 'default';

export interface ResolvedDlqFlag<T> {
  /** 'per-queue' = the queue-specific override is stored and won; 'shared' =
   * the shared queue_dlq_retry_* flag is stored and won; 'default' = neither
   * is stored, so the registered default (or the queue's fallback constant)
   * applies. */
  source: FlagSource;
  /** The effective value the processors evaluate — matches what
   * payment/notification/email processors use for this queue. */
  value: T;
  /** The flag key that supplied the value. */
  key: string;
}

export interface QueueDlqPolicy {
  queue: DlqQueue;
  toggle: ResolvedDlqFlag<boolean>;
  maxPasses: ResolvedDlqFlag<number>;
  baseDelayMs: ResolvedDlqFlag<number>;
}

/**
 * Fallback constants per queue, mirroring each processor's private defaults
 * (email's 60s base reflects the emails queue's native exponential backoff —
 * the longest in the app — and its provider-throttle risk). Used only when no
 * per-queue or shared flag is stored AND no registered default supplies a
 * usable value.
 */
export const DLQ_QUEUE_DEFAULTS: Record<DlqQueue, { maxPasses: number; baseDelayMs: number }> = {
  payments: { maxPasses: 3, baseDelayMs: 30000 },
  notifications: { maxPasses: 3, baseDelayMs: 30000 },
  emails: { maxPasses: 3, baseDelayMs: 60000 },
};

const PER_QUEUE_KEYS: Record<DlqQueue, { toggle: string; maxPasses: string; baseDelayMs: string }> =
  {
    payments: {
      toggle: queueFlags.dlqRetryPayments,
      maxPasses: queueFlags.dlqRetryMaxPassesPayments,
      baseDelayMs: queueFlags.dlqRetryBaseDelayMsPayments,
    },
    notifications: {
      toggle: queueFlags.dlqRetryNotifications,
      maxPasses: queueFlags.dlqRetryMaxPassesNotifications,
      baseDelayMs: queueFlags.dlqRetryBaseDelayMsNotifications,
    },
    emails: {
      toggle: queueFlags.dlqRetryEmails,
      maxPasses: queueFlags.dlqRetryMaxPassesEmails,
      baseDelayMs: queueFlags.dlqRetryBaseDelayMsEmails,
    },
  };

/** Validate a numeric flag payload the way the processors do (positive
 * finite number; max passes floored to an integer ≥ 1). */
function asUsableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  return null;
}

/**
 * Resolve the effective dead-letter retry policy for one queue: which flag won
 * (per-queue override → shared flag → registered default / fallback constant)
 * and the exact value the processor will use. This mirrors the precedence the
 * payment/notification/email processors evaluate inline in maybeDeadLetterRetry
 * — keep the two in lockstep. The per-job `retryDelay` fallback is a job-level
 * override applied at retry time and is intentionally not part of the
 * queue-level policy shown here.
 */
export async function resolveDlqPolicy(
  flags: FeatureFlagService,
  queue: DlqQueue
): Promise<QueueDlqPolicy> {
  const keys = PER_QUEUE_KEYS[queue];
  const defaults = DLQ_QUEUE_DEFAULTS[queue];

  // --- Toggle: per-queue stored → shared stored → registered default ---
  const perQueueToggle = await flags.getFlag(keys.toggle);
  const sharedToggle = await flags.getFlag(queueFlags.dlqRetry);
  let toggle: ResolvedDlqFlag<boolean>;
  if (perQueueToggle) {
    toggle = {
      source: 'per-queue',
      value: await flags.isEnabled(keys.toggle),
      key: keys.toggle,
    };
  } else if (sharedToggle) {
    toggle = {
      source: 'shared',
      value: await flags.isEnabled(queueFlags.dlqRetry),
      key: queueFlags.dlqRetry,
    };
  } else {
    toggle = {
      source: 'default',
      value: await flags.isEnabled(queueFlags.dlqRetry),
      key: queueFlags.dlqRetry,
    };
  }

  // --- Max passes: per-queue → shared → default, validated like the
  // processors (integer ≥ 1) with the queue's fallback constant. ---
  const maxPasses = await resolveNumeric(
    flags,
    keys.maxPasses,
    queueFlags.dlqRetryMaxPasses,
    defaults.maxPasses,
    (value) => (value >= 1 ? Math.floor(value) : null)
  );

  // --- Base delay (ms): per-queue → shared → default, positive number with
  // the queue's fallback constant (emails 60s). ---
  const baseDelayMs = await resolveNumeric(
    flags,
    keys.baseDelayMs,
    queueFlags.dlqRetryBaseDelayMs,
    defaults.baseDelayMs,
    (value) => value
  );

  return { queue, toggle, maxPasses, baseDelayMs };
}

async function resolveNumeric(
  flags: FeatureFlagService,
  perQueueKey: string,
  sharedKey: string,
  fallback: number,
  coerce: (value: number) => number | null
): Promise<ResolvedDlqFlag<number>> {
  const perQueue = await flags.getFlag(perQueueKey);
  const shared = await flags.getFlag(sharedKey);

  if (perQueue) {
    return {
      source: 'per-queue',
      value: coerceValue(await flags.getValue(perQueueKey), coerce, fallback),
      key: perQueueKey,
    };
  }
  if (shared) {
    return {
      source: 'shared',
      value: coerceValue(await flags.getValue(sharedKey), coerce, fallback),
      key: sharedKey,
    };
  }
  return {
    source: 'default',
    value: coerceValue(await flags.getValue(sharedKey), coerce, fallback),
    key: sharedKey,
  };
}

function coerceValue(
  raw: unknown,
  coerce: (value: number) => number | null,
  fallback: number
): number {
  const usable = asUsableNumber(raw);
  if (usable === null) {
    return fallback;
  }
  return coerce(usable) ?? fallback;
}

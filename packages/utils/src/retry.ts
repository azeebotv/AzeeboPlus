/**
 * Retry utility with exponential backoff and jitter.
 * Used for outbound HTTP calls (Paystack, Flutterwave, etc.)
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  jitterFactor?: number;
  timeoutMs?: number;
  retryOn?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'retryOn'>> & {
  retryOn?: (error: Error, attempt: number) => boolean;
} = {
  maxAttempts: 3,
  baseDelayMs: 100,
  jitterFactor: 0.3,
  timeoutMs: 3000,
  retryOn: undefined,
};

/**
 * Execute a function with retry logic, exponential backoff, and jitter.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of fn
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (opts.retryOn && !opts.retryOn(lastError, attempt)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = exponentialDelay * opts.jitterFactor * Math.random();
      const delay = exponentialDelay + jitter;

      // Add timeout if specified
      if (opts.timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, opts.timeoutMs)));
      } else {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  halfOpenRequests?: number;
}

export interface CircuitBreakerStats {
  failures: number;
  successes: number;
  state: CircuitState;
  lastFailure?: Date;
  lastSuccess?: Date;
  nextAttempt?: Date;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private nextAttempt?: Date;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenRequests: number;
  private halfOpenRequestCount: number = 0;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 60000;
    this.halfOpenRequests = options.halfOpenRequests ?? 3;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttempt && new Date() >= this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenRequestCount = 0;
      } else {
        throw new CircuitBreakerOpenError(`Circuit breaker is OPEN. Next attempt at: ${this.nextAttempt?.toISOString()}`);
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequestCount >= this.halfOpenRequests) {
        throw new CircuitBreakerOpenError('Circuit breaker is HALF_OPEN. Max requests reached.');
      }
      this.halfOpenRequestCount++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccess = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequestCount >= this.halfOpenRequests) {
        this.reset();
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.tripCircuit();
    } else if (this.failures >= this.failureThreshold) {
      this.tripCircuit();
    }
  }

  private tripCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.resetTimeout);
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = undefined;
    this.halfOpenRequestCount = 0;
  }

  getStats(): CircuitBreakerStats {
    return {
      failures: this.failures,
      successes: this.successes,
      state: this.state,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      nextAttempt: this.nextAttempt,
    };
  }

  getState(): CircuitState {
    return this.state;
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  resetCircuit(): void {
    this.reset();
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

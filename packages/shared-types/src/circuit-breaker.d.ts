export declare enum CircuitState {
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
export declare class CircuitBreaker {
  private state;
  private failures;
  private successes;
  private lastFailure?;
  private lastSuccess?;
  private nextAttempt?;
  private readonly failureThreshold;
  private readonly resetTimeout;
  private readonly halfOpenRequests;
  private halfOpenRequestCount;
  constructor(options?: CircuitBreakerOptions);
  execute<T>(fn: () => Promise<T>): Promise<T>;
  private onSuccess;
  private onFailure;
  private tripCircuit;
  private reset;
  getStats(): CircuitBreakerStats;
  getState(): CircuitState;
  isOpen(): boolean;
  resetCircuit(): void;
}
export declare class CircuitBreakerOpenError extends Error {
  constructor(message: string);
}
export declare function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker;

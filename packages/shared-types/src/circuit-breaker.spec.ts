import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitState,
  createCircuitBreaker,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
    expect(cb.isOpen()).toBe(false);
  });

  it('should execute function successfully in CLOSED state', async () => {
    const cb = new CircuitBreaker();
    const result = await cb.execute(async () => 42);
    expect(result).toBe(42);
  });

  it('should track successes', async () => {
    const cb = new CircuitBreaker();
    await cb.execute(async () => 'ok');
    const stats = cb.getStats();
    expect(stats.successes).toBe(1);
    expect(stats.failures).toBe(0);
  });

  it('should track failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    const stats = cb.getStats();
    expect(stats.failures).toBe(1);
    expect(stats.successes).toBe(0);
  });

  it('should open circuit after failure threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    expect(cb.isOpen()).toBe(true);
    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  it('should throw CircuitBreakerOpenError when circuit is OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 });
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    await expect(cb.execute(async () => 'ok')).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('should reset failure count on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    // One failure
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    // Success resets the failure count
    await cb.execute(async () => 'ok');
    const stats = cb.getStats();
    expect(stats.failures).toBe(0);
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 1000 });
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    expect(cb.isOpen()).toBe(true);

    // Advance time past reset timeout
    jest.advanceTimersByTime(1100);

    // Next call should transition to HALF_OPEN and execute
    const result = await cb.execute(async () => 'ok');
    expect(result).toBe('ok');
    jest.useRealTimers();
  });

  it('should reset circuit after successful half-open requests', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeout: 1000,
      halfOpenRequests: 2,
    });

    // Trip the circuit
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }

    // Advance past reset timeout
    jest.advanceTimersByTime(1100);

    // Successful requests in half-open
    await cb.execute(async () => 'ok');
    await cb.execute(async () => 'ok');

    // Circuit should be back to CLOSED
    expect(cb.getState()).toBe(CircuitState.CLOSED);
    jest.useRealTimers();
  });

  it('should re-open circuit if failure occurs in HALF_OPEN', async () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 1000 });

    // Trip the circuit
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }

    jest.advanceTimersByTime(1100);

    // Failure in half-open should re-open
    try {
      await cb.execute(async () => {
        throw new Error('fail again');
      });
    } catch {
      // expected
    }

    expect(cb.isOpen()).toBe(true);
    jest.useRealTimers();
  });

  it('should manually reset circuit', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 });
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }
    expect(cb.isOpen()).toBe(true);

    cb.resetCircuit();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
    expect(cb.isOpen()).toBe(false);
  });
});

describe('createCircuitBreaker', () => {
  it('should create a CircuitBreaker instance', () => {
    const cb = createCircuitBreaker();
    expect(cb).toBeInstanceOf(CircuitBreaker);
  });

  it('should accept options', () => {
    const cb = createCircuitBreaker({ failureThreshold: 10 });
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });
});

describe('CircuitBreakerOpenError', () => {
  it('should be an instance of Error', () => {
    const error = new CircuitBreakerOpenError('circuit open');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CircuitBreakerOpenError');
    expect(error.message).toBe('circuit open');
  });
});

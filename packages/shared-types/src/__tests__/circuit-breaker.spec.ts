import { CircuitBreaker } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  describe('basic functionality', () => {
    it('should execute function successfully when closed', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      const result = await breaker.execute(() => Promise.resolve('success'));

      expect(result).toBe('success');
    });

    it('should throw error when circuit is open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 1000,
      });

      try {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      } catch {
        // ignore first error to open circuit
      }

      await expect(breaker.execute(() => Promise.resolve('success'))).rejects.toThrow(
        'Circuit breaker is OPEN'
      );
    });

    it('should close circuit after reset timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 50,
      });

      try {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      } catch {
        // ignore first error to open circuit
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await breaker.execute(() => Promise.resolve('success'));

      expect(result).toBe('success');
    });

    it('should reset failures on success', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      try {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      } catch {
        // ignore
      }

      const result = await breaker.execute(() => Promise.resolve('success'));

      expect(result).toBe('success');
    });
  });
});

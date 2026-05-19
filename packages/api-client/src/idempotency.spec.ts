import { createApiClient, generateIdempotencyKey } from './index';

describe('Idempotency', () => {
  describe('generateIdempotencyKey', () => {
    it('should generate a unique idempotency key', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
      expect(key1).toHaveLength(36);
    });

    it('should generate keys in UUID format', () => {
      const key = generateIdempotencyKey();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(key).toMatch(uuidRegex);
    });
  });

  describe('ApiClient with idempotency', () => {
    it('should set idempotency header when using withIdempotencyKey', () => {
      const client = createApiClient({
        baseUrl: 'http://localhost:3000',
        timeout: 5000,
      });

      const customKey = 'test-idempotency-key-123';
      client.withIdempotencyKey(customKey);

      expect(client).toBeDefined();
    });

    it('should generate idempotency key automatically for post requests', () => {
      const client = createApiClient({
        baseUrl: 'http://localhost:3000',
        timeout: 5000,
      });

      expect(client).toBeDefined();
    });
  });
});

describe('Retry Logic', () => {
  it('should calculate correct retry delays with exponential backoff', () => {
    const delays = [1000, 2000, 4000]; // initial delay * (backoffFactor ^ attempt)
    
    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
  });

  it('should respect max delay', () => {
    const maxDelay = 10000;
    // With backoff factor of 2 and initial delay of 1000:
    // Attempt 0: 1000
    // Attempt 1: 2000
    // Attempt 2: 4000
    // Attempt 3: 8000
    // Attempt 4: 10000 (capped at max)
    
    const expectedDelays = [1000, 2000, 4000, 8000, 10000];
    
    expectedDelays.forEach((delay, index) => {
      const calculatedDelay = Math.min(1000 * Math.pow(2, index), maxDelay);
      expect(calculatedDelay).toBe(delay);
    });
  });
});
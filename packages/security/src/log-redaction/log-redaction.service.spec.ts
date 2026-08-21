import { LogRedactionService } from './log-redaction.service';

describe('LogRedactionService', () => {
  let service: LogRedactionService;

  beforeEach(() => {
    service = new LogRedactionService();
  });

  describe('redactString', () => {
    it('should redact email addresses', () => {
      const result = service.redactString('User email: alice@example.com');
      expect(result).not.toContain('alice@example.com');
      expect(result).toContain('***');
    });

    it('should redact API keys', () => {
      const result = service.redactString('api_key_sk_12345678901234567890');
      expect(result).not.toContain('sk_12345678901234567890');
    });

    it('should redact JWT tokens', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
      const result = service.redactString(`Token: ${jwt}`);
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    });

    it('should redact credit card numbers', () => {
      const result = service.redactString('Card: 4111-1111-1111-1111');
      expect(result).not.toContain('4111');
      expect(result).toContain('****');
    });

    it('should not redact safe strings', () => {
      const safe = 'User logged in successfully at 2026-01-01';
      expect(service.redactString(safe)).toBe(safe);
    });
  });

  describe('redactObject', () => {
    it('should redact password fields', () => {
      const result = service.redactObject({
        username: 'alice',
        password: 'secret123',
        email: 'alice@test.com',
      });

      expect(result.username).toBe('alice');
      expect(result.password).toBe('***REDACTED***');
      expect(result.email).not.toContain('alice@test.com');
    });

    it('should redact token fields', () => {
      const result = service.redactObject({
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc',
        refreshToken: 'refresh_token_value',
      });

      expect(result.accessToken).toBe('***REDACTED***');
      expect(result.refreshToken).toBe('***REDACTED***');
    });

    it('should recursively redact nested objects', () => {
      const result = service.redactObject({
        user: {
          name: 'Alice',
          secret: 'hidden',
        },
      }) as { user: Record<string, unknown> };

      expect(result.user.name).toBe('Alice');
      expect(result.user.secret).toBe('***REDACTED***');
    });

    it('should handle null and undefined', () => {
      expect(service.redactObject(null as never)).toBeNull();
      expect(service.redactObject(undefined as never)).toBeUndefined();
    });
  });

  describe('redactLogData', () => {
    it('should redact string data', () => {
      const result = service.redactLogData('email: test@example.com') as string;
      expect(result).not.toContain('test@example.com');
    });

    it('should redact object data', () => {
      const result = service.redactLogData({ password: 'secret' }) as Record<string, unknown>;
      expect(result.password).toBe('***REDACTED***');
    });

    it('should pass through primitives', () => {
      expect(service.redactLogData(42)).toBe(42);
      expect(service.redactLogData(true)).toBe(true);
    });
  });
});

import { SanitizeInterceptor, SENSITIVE_FIELDS } from './sanitize.interceptor';
import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('SanitizeInterceptor', () => {
  let interceptor: SanitizeInterceptor;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(() => {
    interceptor = new SanitizeInterceptor();
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('Sensitive Fields Removal', () => {
    it('should remove password field from response', (done) => {
      const mockData = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'secret123',
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result).not.toHaveProperty('password');
        done();
      });
    });

    it('should remove token field from response', (done) => {
      const mockData = {
        id: 'user-1',
        token: 'jwt-token-123',
        accessToken: 'access-token-456',
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toHaveProperty('id');
        expect(result).not.toHaveProperty('token');
        expect(result).not.toHaveProperty('accessToken');
        done();
      });
    });

    it('should remove secret fields from response', (done) => {
      const mockData = {
        id: 'api-1',
        name: 'My API Key',
        secretKey: 'sk-123456',
        apiKey: 'ak-789012',
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).not.toHaveProperty('secretKey');
        expect(result).not.toHaveProperty('apiKey');
        done();
      });
    });

    it('should remove credit card fields from response', (done) => {
      const mockData = {
        id: 'payment-1',
        cardNumber: '4111111111111111',
        cvv: '123',
        amount: 100,
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('amount');
        expect(result).not.toHaveProperty('cardNumber');
        expect(result).not.toHaveProperty('cvv');
        done();
      });
    });
  });

  describe('Nested Object Sanitization', () => {
    it('should remove sensitive fields from nested objects', (done) => {
      const mockData = {
        id: 'user-1',
        profile: {
          name: 'John Doe',
          password: 'secret',
          settings: {
            theme: 'dark',
            secretKey: 'sk-123',
          },
        },
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        const typedResult = result as typeof mockData;
        expect(typedResult).toHaveProperty('profile');
        expect(typedResult.profile).toHaveProperty('name');
        expect(typedResult.profile).not.toHaveProperty('password');
        expect(typedResult.profile.settings).toHaveProperty('theme');
        expect(typedResult.profile.settings).not.toHaveProperty('secretKey');
        done();
      });
    });

    it('should handle arrays of objects', (done) => {
      const mockData = {
        users: [
          { id: 'user-1', email: 'user1@test.com', password: 'pass1' },
          { id: 'user-2', email: 'user2@test.com', password: 'pass2' },
        ],
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        const typedResult = result as typeof mockData;
        expect(typedResult.users).toHaveLength(2);
        expect(typedResult.users[0]).not.toHaveProperty('password');
        expect(typedResult.users[1]).not.toHaveProperty('password');
        expect(typedResult.users[0]).toHaveProperty('id');
        expect(typedResult.users[1]).toHaveProperty('id');
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', (done) => {
      mockCallHandler.handle = jest.fn(() => of(null));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should handle undefined values', (done) => {
      mockCallHandler.handle = jest.fn(() => of(undefined));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should handle primitive values', (done) => {
      mockCallHandler.handle = jest.fn(() => of('test string'));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toBe('test string');
        done();
      });
    });

    it('should handle empty objects', (done) => {
      mockCallHandler.handle = jest.fn(() => of({}));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({});
        done();
      });
    });

    it('should handle empty arrays', (done) => {
      mockCallHandler.handle = jest.fn(() => of([]));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('Case Insensitivity', () => {
    it('should remove fields regardless of case', (done) => {
      const mockData = {
        id: 'user-1',
        Password: 'secret',
        TOKEN: 'jwt-123',
        Secret: 'sk-456',
      };

      mockCallHandler.handle = jest.fn(() => of(mockData));

      interceptor.intercept({} as ExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toHaveProperty('id');
        expect(result).not.toHaveProperty('Password');
        expect(result).not.toHaveProperty('TOKEN');
        expect(result).not.toHaveProperty('Secret');
        done();
      });
    });
  });
});

describe('SENSITIVE_FIELDS', () => {
  it('should contain expected sensitive field names', () => {
    expect(SENSITIVE_FIELDS).toContain('password');
    expect(SENSITIVE_FIELDS).toContain('token');
    expect(SENSITIVE_FIELDS).toContain('secret');
    expect(SENSITIVE_FIELDS).toContain('apikey');
    expect(SENSITIVE_FIELDS).toContain('creditcard');
  });
});

import { isPlaceholderSecret, validateNoPlaceholders } from './secret-validation';

describe('Secret Validation', () => {
  describe('isPlaceholderSecret', () => {
    it('should detect "your_secret_key" as placeholder', () => {
      expect(isPlaceholderSecret('your_secret_key')).toBe(true);
    });

    it('should detect "change_me" as placeholder', () => {
      expect(isPlaceholderSecret('change_me')).toBe(true);
    });

    it('should detect "example_value" as placeholder', () => {
      expect(isPlaceholderSecret('example_value')).toBe(true);
    });

    it('should detect "xxx" as placeholder', () => {
      expect(isPlaceholderSecret('xxx')).toBe(true);
    });

    it('should detect "test123" as placeholder', () => {
      expect(isPlaceholderSecret('test123')).toBe(true);
    });

    it('should detect "dummy_key" as placeholder', () => {
      expect(isPlaceholderSecret('dummy_key')).toBe(true);
    });

    it('should detect "secret_value" as placeholder', () => {
      expect(isPlaceholderSecret('secret_value')).toBe(true);
    });

    it('should detect "password123" as placeholder', () => {
      expect(isPlaceholderSecret('password123')).toBe(true);
    });

    it('should accept a real JWT secret', () => {
      expect(isPlaceholderSecret('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')).toBe(false);
    });

    it('should accept a base64 encoded secret', () => {
      expect(isPlaceholderSecret('dGhpcyBpcyBhIHJlYWwgc2VjcmV0IGtleQ==')).toBe(false);
    });

    it('should accept a hex encoded key', () => {
      expect(isPlaceholderSecret('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4')).toBe(false);
    });
  });

  describe('validateNoPlaceholders', () => {
    it('should return empty array when all secrets are valid', () => {
      const env = {
        JWT_ACCESS_SECRET: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        JWT_REFRESH_SECRET: 'x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4',
      };
      const secretKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

      const result = validateNoPlaceholders(env, secretKeys);

      expect(result).toEqual([]);
    });

    it('should return keys with placeholder values', () => {
      const env = {
        JWT_ACCESS_SECRET: 'your_jwt_secret',
        JWT_REFRESH_SECRET: 'x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4',
      };
      const secretKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

      const result = validateNoPlaceholders(env, secretKeys);

      expect(result).toContain('JWT_ACCESS_SECRET');
      expect(result).not.toContain('JWT_REFRESH_SECRET');
    });

    it('should ignore undefined keys', () => {
      const env = {
        JWT_ACCESS_SECRET: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      };
      const secretKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

      const result = validateNoPlaceholders(env, secretKeys);

      expect(result).toEqual([]);
    });

    it('should detect multiple placeholders', () => {
      const env = {
        JWT_ACCESS_SECRET: 'test_secret',
        JWT_REFRESH_SECRET: 'dummy_key',
        SESSION_SECRET: 'a1b2c3d4e5f6g7h8',
      };
      const secretKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];

      const result = validateNoPlaceholders(env, secretKeys);

      expect(result).toContain('JWT_ACCESS_SECRET');
      expect(result).toContain('JWT_REFRESH_SECRET');
      expect(result).not.toContain('SESSION_SECRET');
    });
  });
});

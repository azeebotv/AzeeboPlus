import { isPlaceholderSecret, validateNoPlaceholders } from './secret-validation';

// Mock console to suppress output during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('isPlaceholderSecret', () => {
  it('should detect "your_*" patterns', () => {
    expect(isPlaceholderSecret('your_secret_key_here')).toBe(true);
    expect(isPlaceholderSecret('your-api-key')).toBe(true);
  });

  it('should detect "change_me" patterns', () => {
    expect(isPlaceholderSecret('change_me')).toBe(true);
    expect(isPlaceholderSecret('changeMe123')).toBe(true);
  });

  it('should detect "replace_me" patterns', () => {
    expect(isPlaceholderSecret('replace_me')).toBe(true);
    expect(isPlaceholderSecret('replace-me-now')).toBe(true);
  });

  it('should detect "example" patterns', () => {
    expect(isPlaceholderSecret('example_secret')).toBe(true);
  });

  it('should detect "xxx" patterns', () => {
    expect(isPlaceholderSecret('xxx')).toBe(true);
    expect(isPlaceholderSecret('xxxxx')).toBe(true);
  });

  it('should detect "placeholder" patterns', () => {
    expect(isPlaceholderSecret('placeholder_key')).toBe(true);
  });

  it('should detect "test" patterns', () => {
    expect(isPlaceholderSecret('test_secret')).toBe(true);
  });

  it('should detect "dummy" patterns', () => {
    expect(isPlaceholderSecret('dummy_key')).toBe(true);
  });

  it('should detect "secret" patterns', () => {
    expect(isPlaceholderSecret('secret_key_value')).toBe(true);
  });

  it('should detect "password" patterns', () => {
    expect(isPlaceholderSecret('password123')).toBe(true);
  });

  it('should detect "key" patterns', () => {
    expect(isPlaceholderSecret('key_value')).toBe(true);
  });

  it('should detect "token" patterns', () => {
    expect(isPlaceholderSecret('token_value')).toBe(true);
  });

  it('should return false for real-looking secrets', () => {
    expect(isPlaceholderSecret('sk_live_abc123def456')).toBe(false);
    expect(isPlaceholderSecret('AKIAIOSFODNN7EXAMPLE')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isPlaceholderSecret('')).toBe(false);
  });
});

describe('validateNoPlaceholders', () => {
  it('should find placeholder secrets', () => {
    const env = {
      JWT_SECRET: 'your_secret_key',
      API_KEY: 'real_key_12345',
      DB_PASSWORD: 'change_me',
    };
    const result = validateNoPlaceholders(env, ['JWT_SECRET', 'API_KEY', 'DB_PASSWORD']);
    expect(result).toContain('JWT_SECRET');
    expect(result).toContain('DB_PASSWORD');
    expect(result).not.toContain('API_KEY');
  });

  it('should return empty array when no placeholders', () => {
    const env = {
      JWT_SECRET: 'sk_live_abc123def456ghi789',
      API_KEY: 'real_key_12345',
    };
    const result = validateNoPlaceholders(env, ['JWT_SECRET', 'API_KEY']);
    expect(result).toEqual([]);
  });

  it('should handle undefined values', () => {
    const env = {
      JWT_SECRET: undefined,
    };
    const result = validateNoPlaceholders(env, ['JWT_SECRET']);
    expect(result).toEqual([]);
  });

  it('should handle empty secret keys list', () => {
    const env = { KEY: 'value' };
    const result = validateNoPlaceholders(env, []);
    expect(result).toEqual([]);
  });
});

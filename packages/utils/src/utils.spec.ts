import {
  formatCurrency,
  formatDuration,
  truncate,
  parseJwt,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  sanitizeHtml,
  sanitizeText,
  stripAllHtml,
  toNumber,
  addDecimals,
} from './index';

describe('formatCurrency', () => {
  it('should format NGN currency with naira symbol', () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain('₦');
    expect(result).toContain('1,234.50');
  });

  it('should format USD currency with dollar symbol', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('99.99');
  });

  it('should format EUR currency with euro symbol', () => {
    const result = formatCurrency(50, 'EUR');
    expect(result).toContain('€');
  });

  it('should format GBP currency with pound symbol', () => {
    const result = formatCurrency(25.5, 'GBP');
    expect(result).toContain('£');
  });

  it('should default to NGN when no currency specified', () => {
    const result = formatCurrency(100);
    expect(result).toContain('₦');
  });

  it('should use raw currency string when symbol not found', () => {
    const result = formatCurrency(100, 'JPY');
    expect(result).toContain('JPY');
  });

  it('should always show 2 decimal places', () => {
    const result = formatCurrency(100);
    expect(result).toContain('.00');
  });
});

describe('formatDuration', () => {
  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('should pad single digit seconds', () => {
    expect(formatDuration(5)).toBe('0:05');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1:30');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('should handle exactly one hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });

  it('should handle zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('truncate', () => {
  it('should truncate text that exceeds length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('should not truncate text within length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should not truncate text at exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});

describe('parseJwt', () => {
  it('should parse a valid JWT token', () => {
    // Create a minimal valid JWT: header.payload.signature
    const payload = { sub: '123', name: 'Test User' };
    const encoded = btoa(JSON.stringify(payload));
    const token = `eyJhbGciOiJIUzI1NiJ9.${encoded}.signature`;
    const result = parseJwt(token);
    expect(result).toEqual({ sub: '123', name: 'Test User' });
  });

  it('should return null for invalid token', () => {
    expect(parseJwt('invalid-token')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseJwt('')).toBeNull();
  });

  it('should handle tokens with URL-safe base64 characters', () => {
    // Create payload with characters that produce - and _ in base64
    const payload = { data: 'test>with<symbols' };
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
    const token = `header.${encoded}.signature`;
    const result = parseJwt(token);
    expect(result).toEqual({ data: 'test>with<symbols' });
  });
});

describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should return true for email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('should return false for email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('should return false for email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('should return false for email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('should return true for valid phone with country code', () => {
    expect(isValidPhone('+2348012345678')).toBe(true);
  });

  it('should return true for phone with spaces and dashes', () => {
    expect(isValidPhone('+1 234-567-8901')).toBe(true);
  });

  it('should return false for too short phone', () => {
    expect(isValidPhone('123')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('should return true for password >= 8 chars', () => {
    expect(isValidPassword('password123')).toBe(true);
  });

  it('should return false for password < 8 chars', () => {
    expect(isValidPassword('short')).toBe(false);
  });

  it('should return true for exactly 8 chars', () => {
    expect(isValidPassword('12345678')).toBe(true);
  });
});

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const result = sanitizeHtml('Hello <script>alert("xss")</script> World');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should remove iframe tags', () => {
    const result = sanitizeHtml('<iframe src="evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
  });

  it('should remove object tags', () => {
    const result = sanitizeHtml('<object data="evil.swf"></object>');
    expect(result).not.toContain('<object');
  });

  it('should remove embed tags', () => {
    const result = sanitizeHtml('<embed src="evil.swf">');
    expect(result).not.toContain('<embed');
  });

  it('should remove javascript: protocol', () => {
    const result = sanitizeHtml('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  it('should remove onclick handlers', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">');
    expect(result).not.toContain('onclick');
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });
});

describe('sanitizeText', () => {
  it('should escape HTML special characters', () => {
    const result = sanitizeText('<script>alert("xss")</script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should escape quotes', () => {
    const result = sanitizeText('He said "hello"');
    expect(result).toContain('&quot;');
  });

  it('should escape single quotes', () => {
    const result = sanitizeText("it's");
    expect(result).toContain('&#x27;');
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('stripAllHtml', () => {
  it('should remove all HTML tags', () => {
    const result = stripAllHtml('<p>Hello <b>World</b></p>');
    expect(result).toBe('Hello World');
  });

  it('should decode HTML entities', () => {
    const result = stripAllHtml('&lt;div&gt;');
    expect(result).toBe('<div>');
  });

  it('should return empty string for empty input', () => {
    expect(stripAllHtml('')).toBe('');
  });
});

describe('toNumber', () => {
  it('should return number as-is', () => {
    expect(toNumber(42)).toBe(42);
  });

  it('should parse string number', () => {
    expect(toNumber('3.14')).toBe(3.14);
  });

  it('should return 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0);
  });

  it('should return 0 for non-numeric string', () => {
    expect(toNumber('abc')).toBe(0);
  });

  it('should parse integer string', () => {
    expect(toNumber('100')).toBe(100);
  });
});

describe('addDecimals', () => {
  it('should format with 2 decimal places by default', () => {
    expect(addDecimals(5)).toBe('5.00');
  });

  it('should format with custom decimal places', () => {
    expect(addDecimals(5.12345, 4)).toBe('5.1235');
  });

  it('should round to specified decimals', () => {
    expect(addDecimals(5.125, 1)).toBe('5.1');
  });
});

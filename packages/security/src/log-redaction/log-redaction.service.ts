import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Sensitive Log Field Redaction (TAA §52)
// ============================================================================

/** Patterns that indicate sensitive data */
const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Email addresses
  { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '***@***.***' },
  // Phone numbers (international)
  { pattern: /(\+\d{1,3})[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, replacement: '***PHONE***' },
  // Credit card numbers
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '****-****-****-****' },
  // API keys and tokens
  { pattern: /\b(sk|pk|api[_-]?key|token|secret|password|passwd|pwd)[-_]?[a-zA-Z0-9_]{20,}\b/gi, replacement: '$1_***REDACTED***' },
  // JWT tokens
  { pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, replacement: 'eyJ***.eyJ***.***' },
  // UUIDs (sometimes sensitive in context)
  { pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, replacement: '***UUID***' },
  // IP addresses (internal)
  { pattern: /\b(10\.\d{1,3}|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g, replacement: '***INTERNAL_IP***' },
  // Social Security Numbers / National IDs
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '***-**-****' },
  // Bank account numbers
  { pattern: /\b\d{8,18}\b/g, replacement: '***ACCOUNT***' },
];

/** Field names that should always be redacted */
const SENSITIVE_FIELD_NAMES = new Set([
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'privatekey',
  'private_key',
  'creditcard',
  'credit_card',
  'cardnumber',
  'card_number',
  'cvv',
  'ssn',
  'socialsecuritynumber',
  'bankaccount',
  'bank_account',
]);

@Injectable()
export class LogRedactionService {

  /**
   * Redact sensitive fields from an object
   */
  redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (obj === null || obj === undefined) return obj;

    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELD_NAMES.has(key.toLowerCase())) {
        redacted[key] = '***REDACTED***';
      } else if (typeof value === 'string') {
        redacted[key] = this.redactString(value);
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactObject(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redact sensitive patterns from a string
   */
  redactString(str: string): string {
    let redacted = str;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, replacement);
    }
    return redacted;
  }

  /**
   * Create a redacted copy of log data
   */
  redactLogData(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
      return this.redactString(data);
    }

    if (typeof data === 'object') {
      return this.redactObject(data as Record<string, unknown>);
    }

    return data;
  }

  /**
   * Middleware-style redaction for NestJS interceptors
   */
  createRedactedLogger(originalLogger: Logger): {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
  } {
    const redact = (args: unknown[]): unknown[] => args.map((a) => this.redactLogData(a));
    return {
      log: (...args: unknown[]) => {
        originalLogger.log(...(redact(args) as [string, ...unknown[]]));
      },
      warn: (...args: unknown[]) => {
        originalLogger.warn(...(redact(args) as [string, ...unknown[]]));
      },
      error: (...args: unknown[]) => {
        originalLogger.error(...(redact(args) as [string, ...unknown[]]));
      },
      debug: (...args: unknown[]) => {
        originalLogger.debug(...(redact(args) as [string, ...unknown[]]));
      },
    };
  }
}

import { Logger } from '@nestjs/common';
export declare class LogRedactionService {
    /**
     * Redact sensitive fields from an object
     */
    redactObject(obj: Record<string, unknown>): Record<string, unknown>;
    /**
     * Redact sensitive patterns from a string
     */
    redactString(str: string): string;
    /**
     * Create a redacted copy of log data
     */
    redactLogData(data: unknown): unknown;
    /**
     * Middleware-style redaction for NestJS interceptors
     */
    createRedactedLogger(originalLogger: Logger): {
        log: (...args: unknown[]) => void;
        warn: (...args: unknown[]) => void;
        error: (...args: unknown[]) => void;
        debug: (...args: unknown[]) => void;
    };
}
/**
 * Pseudonymize an identifier (email, phone) for logging: a short keyed hash
 * keeps logs correlate-able across entries without storing the identifier.
 * Keyed with LOG_PSEUDONYM_SECRET when set (HMAC), otherwise plain SHA-256
 * (still not reversible for high-entropy values, but predictable for common
 * addresses — set the secret in production).
 */
export declare function pseudonymizeIdentifier(value: string): string;

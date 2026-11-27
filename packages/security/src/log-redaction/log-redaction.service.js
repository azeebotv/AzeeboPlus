"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogRedactionService = void 0;
exports.pseudonymizeIdentifier = pseudonymizeIdentifier;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
// ============================================================================
// Sensitive Log Field Redaction (TAA §52)
// ============================================================================
/** Patterns that indicate sensitive data */
const SENSITIVE_PATTERNS = [
    // Email addresses
    { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '***@***.***' },
    // Phone numbers (international)
    {
        pattern: /(\+\d{1,3})[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
        replacement: '***PHONE***',
    },
    // Credit card numbers
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '****-****-****-****' },
    // API keys and tokens
    {
        pattern: /\b(sk|pk|api[_-]?key|token|secret|password|passwd|pwd)[-_]?[a-zA-Z0-9_]{20,}\b/gi,
        replacement: '$1_***REDACTED***',
    },
    // JWT tokens
    {
        pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
        replacement: 'eyJ***.eyJ***.***',
    },
    // UUIDs (sometimes sensitive in context)
    {
        pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
        replacement: '***UUID***',
    },
    // IP addresses (internal)
    {
        pattern: /\b(10\.\d{1,3}|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g,
        replacement: '***INTERNAL_IP***',
    },
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
let LogRedactionService = class LogRedactionService {
    /**
     * Redact sensitive fields from an object
     */
    redactObject(obj) {
        if (obj === null || obj === undefined)
            return obj;
        const redacted = {};
        for (const [key, value] of Object.entries(obj)) {
            if (SENSITIVE_FIELD_NAMES.has(key.toLowerCase())) {
                redacted[key] = '***REDACTED***';
            }
            else if (typeof value === 'string') {
                redacted[key] = this.redactString(value);
            }
            else if (typeof value === 'object' && value !== null) {
                redacted[key] = this.redactObject(value);
            }
            else {
                redacted[key] = value;
            }
        }
        return redacted;
    }
    /**
     * Redact sensitive patterns from a string
     */
    redactString(str) {
        let redacted = str;
        for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
            redacted = redacted.replace(pattern, replacement);
        }
        return redacted;
    }
    /**
     * Create a redacted copy of log data
     */
    redactLogData(data) {
        if (data === null || data === undefined)
            return data;
        if (typeof data === 'string') {
            return this.redactString(data);
        }
        if (typeof data === 'object') {
            return this.redactObject(data);
        }
        return data;
    }
    /**
     * Middleware-style redaction for NestJS interceptors
     */
    createRedactedLogger(originalLogger) {
        const redact = (args) => args.map((a) => this.redactLogData(a));
        return {
            log: (...args) => {
                originalLogger.log(...redact(args));
            },
            warn: (...args) => {
                originalLogger.warn(...redact(args));
            },
            error: (...args) => {
                originalLogger.error(...redact(args));
            },
            debug: (...args) => {
                originalLogger.debug(...redact(args));
            },
        };
    }
};
exports.LogRedactionService = LogRedactionService;
exports.LogRedactionService = LogRedactionService = __decorate([
    (0, common_1.Injectable)()
], LogRedactionService);
/**
 * Pseudonymize an identifier (email, phone) for logging: a short keyed hash
 * keeps logs correlate-able across entries without storing the identifier.
 * Keyed with LOG_PSEUDONYM_SECRET when set (HMAC), otherwise plain SHA-256
 * (still not reversible for high-entropy values, but predictable for common
 * addresses — set the secret in production).
 */
function pseudonymizeIdentifier(value) {
    const secret = process.env.LOG_PSEUDONYM_SECRET;
    const digest = secret
        ? (0, crypto_1.createHmac)('sha256', secret).update(value).digest('hex')
        : (0, crypto_1.createHash)('sha256').update(value).digest('hex');
    return `id_${digest.slice(0, 12)}`;
}

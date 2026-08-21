/**
 * Analytics Event Schema Versioning & PII Minimization (TAA §39)
 *
 * Provides:
 * - Schema version tracking for all analytics events
 * - PII detection and minimization before sending
 * - Event ID generation for deduplication
 * - Consent-aware event filtering
 */

// ---------------------------------------------------------------------------
// Schema Versioning
// ---------------------------------------------------------------------------

export const ANALYTICS_SCHEMA_VERSION = '1.0.0';

export interface VersionedEvent {
  /** Schema version for event compatibility */
  schemaVersion: string;
  /** Unique event ID for deduplication */
  eventId: string;
  /** Event name */
  name: string;
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  /** Anonymous session ID */
  sessionId: string;
  /** User ID (if authenticated and consented) */
  userId?: string;
  /** Event-specific properties */
  properties: Record<string, unknown>;
}

/**
 * Generate a unique event ID (UUID v4)
 */
export function generateEventId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a versioned analytics event
 */
export function createVersionedEvent(
  name: string,
  properties: Record<string, unknown>,
  options: {
    userId?: string;
    sessionId?: string;
  } = {},
): VersionedEvent {
  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    eventId: generateEventId(),
    name,
    timestamp: new Date().toISOString(),
    sessionId: options.sessionId || getOrCreateSessionId(),
    userId: options.userId,
    properties,
  };
}

// ---------------------------------------------------------------------------
// PII Minimization
// ---------------------------------------------------------------------------

/** Patterns that indicate PII */
const PII_PATTERNS = [
  { pattern: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, label: 'email' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, label: 'phone' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'ssn' },
  { pattern: /\b\d{16}\b/g, label: 'credit_card' },
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: 'ip_address' },
];

/** Fields that should never be sent to analytics */
const BLOCKED_FIELDS = new Set([
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
  'bankAccount',
]);

/**
 * Minimize PII in event properties
 * - Hashes email addresses
 * - Redacts phone numbers
 * - Removes blocked fields entirely
 */
export function minimizePii(properties: Record<string, unknown>): Record<string, unknown> {
  const minimized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip blocked fields entirely
    if (BLOCKED_FIELDS.has(key)) {
      continue;
    }

    if (typeof value === 'string') {
      let sanitized = value;

      // Hash emails
      sanitized = sanitized.replace(
        PII_PATTERNS[0].pattern,
        (email) => `[email:${simpleHash(email)}]`,
      );

      // Redact phone numbers
      sanitized = sanitized.replace(
        PII_PATTERNS[1].pattern,
        '[phone:redacted]',
      );

      // Redact SSN
      sanitized = sanitized.replace(
        PII_PATTERNS[2].pattern,
        '[ssn:redacted]',
      );

      // Redact credit card numbers
      sanitized = sanitized.replace(
        PII_PATTERNS[3].pattern,
        '[cc:redacted]',
      );

      // Redact IP addresses
      sanitized = sanitized.replace(
        PII_PATTERNS[4].pattern,
        '[ip:redacted]',
      );

      minimized[key] = sanitized;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively minimize nested objects
      minimized[key] = minimizePii(value as Record<string, unknown>);
    } else {
      minimized[key] = value;
    }
  }

  return minimized;
}

/**
 * Simple string hash for PII fingerprinting (not cryptographic)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ---------------------------------------------------------------------------
// Consent-Aware Filtering
// ---------------------------------------------------------------------------

export interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Filter events based on consent state
 */
export function filterByConsent<T extends { name: string }>(
  event: T,
  consent: ConsentState,
): T | null {
  // Essential events are always sent
  if (event.name.startsWith('auth.') || event.name.startsWith('error.')) {
    return event;
  }

  // Analytics events require analytics consent
  if (!consent.analytics && !event.name.startsWith('auth.')) {
    return null;
  }

  return event;
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

const SESSION_ID_KEY = '@azeebo/analytics_session_id';
const SESSION_EXPIRY_KEY = '@azeebo/analytics_session_expiry';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

    if (existing && expiry && Date.now() < parseInt(expiry, 10)) {
      // Extend session
      localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());
      return existing;
    }

    // Create new session
    const newId = generateEventId();
    localStorage.setItem(SESSION_ID_KEY, newId);
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());
    return newId;
  } catch {
    return 'anonymous';
  }
}

/**
 * Clear the current analytics session
 */
export function clearAnalyticsSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // Ignore
  }
}

/**
 * RFC 7807 (Problem Details for HTTP APIs) error envelope.
 * https://datatracker.ietf.org/doc/html/rfc7807
 *
 * Backend emits: {code, message, details, statusCode, timestamp, path}
 * This interface unifies web + mobile + backend under the RFC 7807 spec
 * while preserving backward-compatible legacy fields.
 */
export interface ErrorResponse {
  success: boolean;

  // --- RFC 7807 fields ---
  type?: string;         // A URI reference that identifies the problem type
  title?: string;        // A short, human-readable summary of the problem type
  status?: number;       // The HTTP status code (same as statusCode)
  detail?: string;       // A human-readable explanation specific to this occurrence
  instance?: string;     // A URI reference that identifies the specific occurrence

  // --- Application-level fields ---
  code?: string;         // Application-specific error code (e.g. "EMAIL_ALREADY_EXISTS")
  message: string;       // Human-readable message (primary, always present)
  error?: string;        // Legacy error field for backward compat
  statusCode?: number;   // Legacy status code field for backward compat
  details?: {
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  timestamp?: string;    // ISO 8601 timestamp of the error
  path?: string;         // Request path that caused the error
}

/**
 * RFC 7807 error for client-side consumption.
 * Used by both web and mobile frontends.
 */
export interface ApiError {
  // --- RFC 7807 fields ---
  type?: string;         // A URI reference that identifies the problem type
  title?: string;        // A short, human-readable summary of the problem type
  status?: number;       // HTTP status code
  detail?: string;       // A human-readable explanation specific to this occurrence
  instance?: string;     // A URI reference that identifies the specific occurrence

  // --- Application-level fields ---
  code?: string;         // Application-specific error code
  message: string;       // Human-readable message (primary, always present)
  error?: string;        // Legacy error string for backward compat
  statusCode?: number;   // Legacy status code for backward compat
  details?: {
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  timestamp?: string;    // ISO 8601 timestamp of the error
  path?: string;         // Request path that caused the error
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'Not Found', `${resource} with id ${id} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'Unauthorized', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'Forbidden', message);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super(422, 'Validation Error', 'Input validation failed', details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, 'Bad Request', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'Conflict', message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(429, 'Too Many Requests', message, retryAfter ? { retryAfter } : undefined);
  }
}

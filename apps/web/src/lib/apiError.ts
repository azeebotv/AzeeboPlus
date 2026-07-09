export class ApiError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  public errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  public retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

interface ApiErrorResponse {
  message?: string;
  status?: number;
  data?: {
    message?: string;
  };
}

interface ErrorWithResponse {
  response?: ApiErrorResponse;
  request?: unknown;
}

export function handleApiError(error: ErrorWithResponse): string {
  if (error instanceof ApiError) {
    return (error as Error).message;
  }

  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection.';
  }

  if (error instanceof ValidationError) {
    return (error as Error).message;
  }

  if (error instanceof AuthenticationError) {
    return 'Please sign in to continue.';
  }

  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.';
  }

  if (error instanceof NotFoundError) {
    return 'The requested resource was not found.';
  }

  if (error instanceof RateLimitError) {
    return 'Too many requests. Please try again later.';
  }

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data?.message || 'Invalid request';
      case 401:
        return 'Please sign in to continue';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'Server error. Please try again later';
      default:
        return data?.message || 'An unexpected error occurred';
    }
  }

  if (error.request) {
    return 'Network error. Please check your connection.';
  }

  return 'An unexpected error occurred';
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function getErrorMessage(error: unknown): string {
  return handleApiError(error as ErrorWithResponse);
}

/**
 * RFC 9457 Problem Details Standardization
 * API-002: Standardize error responses
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ValidationError[];
  code?: string;
  timestamp?: string;
  path?: string;
}

export interface ValidationError {
  path: string;
  rule: string;
  message: string;
  rejected?: unknown;
}

export function createProblem(
  status: number,
  title: string,
  detail?: string,
  code?: string,
  errors?: ValidationError[]
): ProblemDetails {
  return {
    type: `https://api.azeebo.com/problems/${code || deriveCode(status)}`,
    title,
    status,
    detail,
    code: code || deriveCode(status),
    errors,
    timestamp: new Date().toISOString(),
  };
}

function deriveCode(status: number): string {
  const map: Record<number, string> = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
  };
  return map[status] || 'ERROR';
}

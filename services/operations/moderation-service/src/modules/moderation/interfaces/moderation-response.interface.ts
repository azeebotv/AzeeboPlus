import { ApiResponseWrapper } from '@azeebo/shared-types';

export interface ModerationResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function successResponse<T>(data: T, meta?: { page?: number; limit?: number; total?: number }): ModerationResponse {
  return {
    success: true,
    data,
    ...(meta && meta.page !== undefined && { data: { ...meta as Record<string, unknown>, items: data } }),
  } as ModerationResponse;
}

export function errorResponse(code: string, message: string, details?: Record<string, unknown>): ModerationResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

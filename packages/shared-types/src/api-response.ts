import type { ApiResponse, ApiError, PaginationMeta } from './api-response-types';

export class ApiResponseWrapper {
  static success<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      ...(meta && { meta }),
    };
  }

  static error(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ApiResponse<never> {
    const error: ApiError = {
      code,
      message,
      ...(details && { details }),
    };

    return {
      success: false,
      error,
    };
  }

  static created<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      ...(meta && { meta }),
    };
  }

  static paginated<T>(data: T[], page: number, limit: number, total: number): ApiResponse<T[]> {
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return {
      success: true,
      data,
      meta,
    };
  }

  static noContent(): ApiResponse<null> {
    return {
      success: true,
      data: null,
    };
  }
}

export function createSuccessResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return ApiResponseWrapper.success(data, meta);
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return ApiResponseWrapper.error(code, message, details);
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  return ApiResponseWrapper.paginated(data, page, limit, total);
}

export function createCreatedResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return ApiResponseWrapper.created(data, meta);
}

export function createNoContentResponse(): ApiResponse<null> {
  return ApiResponseWrapper.noContent();
}

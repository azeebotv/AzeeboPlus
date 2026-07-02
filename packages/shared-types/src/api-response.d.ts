import { ApiResponse, PaginationMeta } from './index';
export declare class ApiResponseWrapper {
  static success<T>(data: T, meta?: PaginationMeta): ApiResponse<T>;
  static error(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ApiResponse<never>;
  static created<T>(data: T, meta?: PaginationMeta): ApiResponse<T>;
  static paginated<T>(data: T[], page: number, limit: number, total: number): ApiResponse<T[]>;
  static noContent(): ApiResponse<null>;
}
export declare function createSuccessResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T>;
export declare function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never>;
export declare function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]>;
export declare function createCreatedResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T>;
export declare function createNoContentResponse(): ApiResponse<null>;

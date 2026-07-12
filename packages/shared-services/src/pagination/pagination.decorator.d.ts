export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export declare const DEFAULT_PAGE = 1;
export declare const DEFAULT_LIMIT = 20;
export declare const MAX_LIMIT = 100;
export declare const Pagination: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T>;

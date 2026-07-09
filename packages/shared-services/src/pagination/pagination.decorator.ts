import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const Pagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginationOptions => {
    const request = ctx.switchToHttp().getRequest();
    const page = Math.max(1, parseInt(request.query.page) || DEFAULT_PAGE);
    const limit = Math.max(1, Math.min(parseInt(request.query.limit) || DEFAULT_LIMIT, MAX_LIMIT));
    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset,
    };
  }
);

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

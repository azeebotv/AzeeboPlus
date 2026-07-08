export interface CursorPaginationArgs {
  cursor?: { id: string };
  take?: number;
  skip?: number;
}

export interface OffsetPaginationArgs {
  skip: number;
  take: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages: number;
  nextCursor?: string;
}

export function buildCursorPagination(cursor?: string, limit?: number): CursorPaginationArgs {
  const take = Math.min(limit ?? 20, 100);

  if (!cursor) {
    return { take };
  }

  return {
    cursor: { id: cursor },
    take,
    skip: 1,
  };
}

export function buildOffsetPagination(page: number, limit: number): OffsetPaginationArgs {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page?: number,
  limit?: number,
  nextCursor?: string
): PaginatedResponse<T> {
  const response: PaginatedResponse<T> = {
    items: data,
    total,
    totalPages: limit ? Math.ceil(total / limit) : 1,
  };

  if (page !== undefined && limit !== undefined) {
    response.page = page;
    response.limit = limit;
  }

  if (nextCursor !== undefined) {
    response.nextCursor = nextCursor;
  }

  return response;
}

export function extractCursorFromLastItem<T extends { id: string }>(
  items: T[],
  limit: number
): string | undefined {
  if (items.length < limit) {
    return undefined;
  }

  return items[items.length - 1]?.id;
}

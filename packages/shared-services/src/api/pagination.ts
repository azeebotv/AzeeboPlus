export interface PaginationParams { cursor?: string; limit?: number; direction?: 'forward' | 'backward'; }
export interface PaginatedResponse<T> { data: T[]; pagination: { cursor?: string; hasMore: boolean; total?: number; }; }
export function createPaginatedResponse<T>(data: T[], hasMore: boolean, cursor?: string, total?: number): PaginatedResponse<T> {
  return { data, pagination: { cursor, hasMore, total } };
}
export function encodeCursor(id: string): string { return Buffer.from(id).toString('base64url'); }
export function decodeCursor(cursor: string): string { return Buffer.from(cursor, 'base64url').toString(); }

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginationMeta } from './index';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data: unknown) => {
        if (data === null || data === undefined) {
          return {
            success: true,
            data: null,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        if (this.isPaginatedResult(data)) {
          return {
            success: true,
            data: data.items,
            meta: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: data.totalPages,
            },
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }

  private isPaginatedResult(data: unknown): data is PaginatedResult<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      'total' in data &&
      'page' in data &&
      'limit' in data &&
      'totalPages' in data
    );
  }
}

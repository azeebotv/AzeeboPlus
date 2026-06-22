import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseWrapper } from '@azeebo/shared-types';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: unknown;
  meta?: unknown;
}

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((response: unknown) => {
        if (this.isApiResponse(response)) {
          return response;
        }
        return ApiResponseWrapper.success(response);
      })
    );
  }

  private isApiResponse(response: unknown): response is ApiResponse<unknown> {
    if (!response || typeof response !== 'object') {
      return false;
    }
    const resp = response as Record<string, unknown>;
    if (typeof resp.success === 'boolean') {
      return true;
    }
    return false;
  }
}

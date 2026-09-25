import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeOutputInterceptor implements NestInterceptor {
  private readonly fieldsToSanitize = [
    'name',
    'description',
    'bio',
    'content',
    'title',
    'comment',
    'message',
  ];

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.sanitize(data)));
  }

  private sanitize(data: unknown): unknown {
    if (!data) return data;
    if (typeof data === 'string') {
      return sanitizeHtml(data, { allowedTags: [] });
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const key of Object.keys(data)) {
        const value = (data as Record<string, unknown>)[key];
        if (this.fieldsToSanitize.includes(key)) {
          sanitized[key] =
            typeof value === 'string' ? sanitizeHtml(value, { allowedTags: [] }) : value;
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return data;
  }
}

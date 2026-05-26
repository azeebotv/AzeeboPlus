import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeOutputInterceptor implements NestInterceptor {
  private readonly fieldsToSanitize = ['name', 'description', 'bio', 'content', 'title', 'comment', 'message'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.sanitize(data)),
    );
  }

  private sanitize(data: any): any {
    if (!data) return data;
    if (typeof data === 'string') {
      return sanitizeHtml(data, { allowedTags: [] });
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }
    if (typeof data === 'object') {
      const sanitized: Record<string, any> = {};
      for (const key of Object.keys(data)) {
        if (this.fieldsToSanitize.includes(key)) {
          sanitized[key] = typeof data[key] === 'string'
            ? sanitizeHtml(data[key], { allowedTags: [] })
            : data[key];
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          sanitized[key] = this.sanitize(data[key]);
        } else {
          sanitized[key] = data[key];
        }
      }
      return sanitized;
    }
    return data;
  }
}

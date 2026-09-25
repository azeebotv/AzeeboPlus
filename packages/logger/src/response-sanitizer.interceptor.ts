import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SanitizationConfig {
  excludeFields?: string[];
  maskFields?: string[];
}

const DEFAULT_EXCLUDE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'secretKey',
];
const DEFAULT_MASK_FIELDS = ['email', 'phone', 'ssn'];

@Injectable()
export class ResponseSanitizationInterceptor implements NestInterceptor {
  private readonly excludeFields: string[] = DEFAULT_EXCLUDE_FIELDS;
  private readonly maskFields: string[] = DEFAULT_MASK_FIELDS;

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((response: unknown) => {
        if (!response || typeof response !== 'object') {
          return response;
        }
        // Class instances (Date, Map, Buffer, …) pass through untouched —
        // spreading them produces `{}` and silently destroys their data.
        if (!Array.isArray(response) && !this.isPlainObject(response)) {
          return response;
        }

        return this.sanitizeObject(response as Record<string, unknown>);
      })
    );
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    // Handle arrays: sanitize each element and return as-is
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.isSanitizable(item) ? this.sanitizeObject(item as Record<string, unknown>) : item
      ) as unknown as Record<string, unknown>;
    }

    const sanitized = { ...obj };

    for (const key of Object.keys(sanitized)) {
      if (this.excludeFields.includes(key)) {
        delete sanitized[key];
      } else if (this.maskFields.includes(key) && typeof sanitized[key] === 'string') {
        sanitized[key] = this.maskValue(sanitized[key] as string);
      } else if (this.isSanitizable(sanitized[key])) {
        sanitized[key] = this.sanitizeObject(sanitized[key] as Record<string, unknown>);
      }
    }

    return sanitized;
  }

  private isSanitizable(value: unknown): boolean {
    return Array.isArray(value) || this.isPlainObject(value);
  }

  // Only plain objects are copied/sanitized. Class instances keep their
  // prototype: `{ ...someDate }` yields `{}` (no own enumerable properties),
  // which previously wiped every Date field out of API responses.
  private isPlainObject(value: unknown): boolean {
    if (value === null || typeof value !== 'object') {
      return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  private maskValue(value: string): string {
    if (value.length <= 4) {
      return '****';
    }
    return `${value.substring(0, 2)}****${value.substring(value.length - 2)}`;
  }
}

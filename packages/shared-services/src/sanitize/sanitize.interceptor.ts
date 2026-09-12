import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const SENSITIVE_FIELDS = [
  'password',
  'passwordhash',
  'hashedpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'secretkey',
  'apikey',
  'privatekey',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn',
  'socialsecuritynumber',
];

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.sanitizeResponse(data)));
  }

  private sanitizeResponse(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeObject(item));
    }

    // Class instances (Date, Map, Buffer, …) pass through untouched —
    // spreading them produces `{}` and silently destroys their data.
    if (!this.isPlainObject(data)) {
      return data;
    }

    return this.sanitizeObject(data as Record<string, unknown>);
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.isSanitizable(item) ? this.sanitizeObject(item as Record<string, unknown>) : item
      ) as unknown as Record<string, unknown>;
    }

    if (!this.isPlainObject(obj)) {
      return obj;
    }

    const sanitized = { ...obj };

    for (const key of Object.keys(sanitized)) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        delete sanitized[key];
      } else if (this.isSanitizable(sanitized[key])) {
        sanitized[key] = this.sanitizeResponse(sanitized[key]);
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
}

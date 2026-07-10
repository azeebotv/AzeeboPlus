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

    return this.sanitizeObject(data as Record<string, unknown>);
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = { ...obj };

    for (const key of Object.keys(sanitized)) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        delete sanitized[key];
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeResponse(sanitized[key]);
      }
    }

    return sanitized;
  }
}
